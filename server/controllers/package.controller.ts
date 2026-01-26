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

  // Просмотр пакета
  async viewPackage(req: Request, res: Response) {
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

      res.json({
        package: pkg,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error viewing package:", error);
      res.status(500).json({ message: "Failed to view package" });
    }
  }

  // Скачать пакет
  async downloadPackage(req: Request, res: Response) {
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

      const payload = {
        package: pkg,
        generatedAt: new Date().toISOString(),
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="package-${pkg.period}-${pkg.id}.json"`
      );
      res.send(JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error("Error downloading package:", error);
      res.status(500).json({ message: "Failed to download package" });
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
