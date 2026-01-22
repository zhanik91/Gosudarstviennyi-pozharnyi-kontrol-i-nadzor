import type { Request, Response } from "express";
import { storage } from "../storage";
import { insertPackageSchema } from "@shared/schema";
import { toScopeUser } from "../services/authz";

async function canAccessOrgUnit(user: any, orgUnitId?: string | null) {
  if (!user || !orgUnitId) return false;
  if (user.role === "MCHS") return true;
  if (user.role === "DISTRICT") return user.orgUnitId === orgUnitId;
  const hierarchy = await storage.getOrganizationHierarchy(user.orgUnitId);
  return hierarchy.some((org) => org.id === orgUnitId);
}

export class PackageController {

  // Получить пакеты
  async getPackages(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      const filters: any = {};
      const scopeUser = toScopeUser(user);

      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.period) filters.period = req.query.period as string;
      if (scopeUser) filters.scopeUser = scopeUser;

      if (user?.role === "MCHS" && req.query.orgUnitId) {
        filters.orgUnitId = req.query.orgUnitId as string;
      }

      const packages = await storage.getPackages(filters);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  }

  // Создать пакет
  async createPackage(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      const orgUnitId =
        user?.role === "MCHS" && req.body.orgUnitId
          ? req.body.orgUnitId
          : user?.orgUnitId;
      if (!orgUnitId) {
        return res.status(400).json({ message: "User must be assigned to an organization" });
      }

      const packageData = insertPackageSchema.parse({
        ...req.body,
        orgUnitId,
      });

      const pkg = await storage.createPackage(packageData);

      await storage.createAuditLog({
        userId: user.id,
        action: 'create',
        entityType: 'package',
        entityId: pkg.id,
        details: packageData,
        ipAddress: req.ip,
      });

      res.json(pkg);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "Failed to create package" });
    }
  }

  // Отправить пакет
  async submitPackage(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      const pkg = await storage.getPackage(req.params.id);

      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      const canAccess = await canAccessOrgUnit(user, pkg.orgUnitId);
      if (!canAccess) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Deadline Enforcement (Day 6 Check)
      // Forms are due by the 27th of the month following the reporting period.
      // But user might be submitting for *current* month?
      // Usually statistics are for *previous* month submitted by 27th of *current*.
      // Or for *current* month submitted by 27th?
      // Order 377 says "monthly by 27th". Assuming "reporting period" is Month X, submission is Month X+1?
      // Or maybe Month X data is submitted in Month X by 27th?
      // Let's assume deadline is 27th of the *current calendar month* for whatever package is being submitted now.

      const today = new Date();
      const dayOfMonth = today.getDate();
      const isLate = dayOfMonth > 27;

      // Allow MCHS/Admin to override
      const isPrivileged = ['MCHS', 'admin'].includes(user?.role || '');

      if (isLate && !isPrivileged) {
         // Check if this is indeed a 'late' submission attempt.
         // If they are submitting a package for a past period, it's definitely late.
         // If they are submitting for current period after 27th, it's late.
         return res.status(400).json({
             message: "Срок сдачи отчетов истек (до 27-го числа). Обратитесь к администратору."
         });
      }

      const updatedPackage = await storage.updatePackage(req.params.id, {
        status: 'submitted',
        submittedBy: user!.id,
        submittedAt: new Date(),
      });

      await storage.createAuditLog({
        userId: user!.id,
        action: 'submit',
        entityType: 'package',
        entityId: pkg.id,
        ipAddress: req.ip,
      });

      res.json(updatedPackage);
    } catch (error) {
      console.error("Error submitting package:", error);
      res.status(500).json({ message: "Failed to submit package" });
    }
  }

  // Утвердить пакет
  async approvePackage(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      if (!['MCHS', 'DCHS'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const pkg = await storage.getPackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      // Handle extra fields from request body if they exist (merging logic from routes/packages.ts)
      const { comment } = req.body;

      const updatedPackage = await storage.updatePackage(req.params.id, {
        status: 'approved',
        approvedBy: user!.id,
        approvedAt: new Date(),
      });

      await storage.createAuditLog({
        userId: user!.id,
        action: 'approve', // normalized action name
        entityType: 'package',
        entityId: pkg.id,
        details: { comment },
        ipAddress: req.ip,
      });

      res.json({ ok: true, package: updatedPackage }); // Unified response format
    } catch (error) {
      console.error("Error approving package:", error);
      res.status(500).json({ message: "Failed to approve package" });
    }
  }

  // Отклонить/Вернуть пакет
  async rejectPackage(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      if (!['MCHS', 'DCHS'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const pkg = await storage.getPackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }

      const { reason, comment } = req.body;
      const rejectionReason = comment ? `${reason} (Returned with comment: ${comment})` : reason;

      const updatedPackage = await storage.updatePackage(req.params.id, {
        status: 'rejected',
        rejectionReason: rejectionReason,
        reviewedBy: user!.id,
        reviewedAt: new Date(),
      });

      await storage.createAuditLog({
        userId: user!.id,
        action: 'reject',
        entityType: 'package',
        entityId: pkg.id,
        details: { reason, comment },
        ipAddress: req.ip,
      });

      res.json({ ok: true, package: updatedPackage });
    } catch (error) {
      console.error("Error rejecting package:", error);
      res.status(500).json({ message: "Failed to reject package" });
    }
  }

  // Консолидация (merged from server/routes/packages.ts)
  async consolidatePackage(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);

      if (!['MCHS', 'DCHS'].includes(user?.role || '')) {
        return res.status(403).json({ ok: false, msg: 'Insufficient permissions' });
      }

      const { period, orgId } = req.body;
      const canAccess = await canAccessOrgUnit(user, orgId);
      if (!canAccess) {
        return res.status(403).json({ ok: false, msg: "Недостаточно прав доступа" });
      }

      const approvedPackages = await storage.getApprovedPackages(orgId, period);

      if (approvedPackages.length === 0) {
        return res.status(400).json({
          ok: false,
          msg: 'Нет утвержденных пакетов для консолидации'
        });
      }

      const consolidatedPackage = await storage.createConsolidatedPackage({
        orgId,
        period,
        sourcePackages: approvedPackages.map(p => p.id),
        createdBy: user!.id,
        status: 'approved'
      });

      await storage.createAuditLog({
        userId: user!.id,
        action: 'PACKAGE_CONSOLIDATE',
        entityType: 'package',
        entityId: consolidatedPackage.id,
        details: {
          period,
          orgId,
          sourcePackagesCount: approvedPackages.length
        },
        ipAddress: req.ip
      });

      res.json({ ok: true, package: consolidatedPackage });
    } catch (error) {
      console.error('Error consolidating package:', error);
      res.status(500).json({ ok: false, msg: 'Consolidation failed' });
    }
  }
}

export const packageController = new PackageController();
