import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';
import { emailService } from '../services/email';

const router = Router();

// Консолидация пакета (для области/РК)
router.post('/api/packages/consolidate', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    
    // Проверяем роль пользователя
    if (!['reviewer', 'approver', 'admin'].includes(user?.role || '')) {
      return res.status(403).json({ ok: false, msg: 'Insufficient permissions' });
    }

    const { period, orgId } = req.body;
    
    // Получаем утвержденные пакеты дочерних организаций
    const approvedPackages = await storage.getApprovedPackages(orgId, period);
    
    if (approvedPackages.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        msg: 'Нет утвержденных пакетов для консолидации' 
      });
    }

    // Создаем сводный пакет
    const consolidatedPackage = await storage.createConsolidatedPackage({
      orgId,
      period,
      sourcePackages: approvedPackages.map(p => p.id),
      createdBy: req.user.claims.sub,
      status: 'approved'
    });

    // Логируем действие
    await storage.createAuditLog({
      userId: req.user.claims.sub,
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
});

// Возврат пакета
router.post('/api/packages/:id/return', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    
    if (!['reviewer', 'approver', 'admin'].includes(user?.role || '')) {
      return res.status(403).json({ ok: false, msg: 'Insufficient permissions' });
    }

    const packageId = req.params.id;
    const { reason, comment } = req.body;

    // Обновляем статус пакета
    // Note: 'returned' status is not in current enum, mapping to 'rejected' for now
    // until schema is updated to include 'returned'
    const returnedPackage = await storage.updatePackage(packageId, {
      status: 'rejected',
      rejectionReason: `${reason} (Returned with comment: ${comment})`,
      reviewedBy: req.user.claims.sub,
      reviewedAt: new Date()
    });

    const packageOwner = await storage.getUser(returnedPackage.submittedBy || '');
    if (packageOwner?.email) {
      await emailService.sendPackageReturnNotification(
        packageOwner.email,
        {
          period: returnedPackage.period,
          returnReason: reason,
          comment: comment
        }
      );
    }

    // Логируем действие
    await storage.createAuditLog({
      userId: req.user.claims.sub,
      action: 'PACKAGE_RETURN',
      entityType: 'package',
      entityId: packageId,
      details: { reason, comment },
      ipAddress: req.ip
    });

    res.json({ ok: true, package: returnedPackage });
  } catch (error) {
    console.error('Error returning package:', error);
    res.status(500).json({ ok: false, msg: 'Return failed' });
  }
});

// Утверждение пакета
router.post('/api/packages/:id/approve', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    
    if (!['approver', 'admin'].includes(user?.role || '')) {
      return res.status(403).json({ ok: false, msg: 'Insufficient permissions' });
    }

    const packageId = req.params.id;
    const { comment } = req.body;

    // Обновляем статус пакета
    const approvedPackage = await storage.updatePackage(packageId, {
      status: 'approved',
      // approvalComment: comment, // Field not in schema
      approvedBy: req.user.claims.sub,
      approvedAt: new Date()
    });

    const packageOwner = await storage.getUser(approvedPackage.submittedBy || '');
    if (packageOwner?.email) {
      await emailService.sendPackageApprovalNotification(
        packageOwner.email,
        {
          period: approvedPackage.period,
          approverName: user?.fullName
        }
      );
    }

    // Логируем действие
    await storage.createAuditLog({
      userId: req.user.claims.sub,
      action: 'PACKAGE_APPROVE',
      entityType: 'package',
      entityId: packageId,
      details: { comment },
      ipAddress: req.ip
    });

    res.json({ ok: true, package: approvedPackage });
  } catch (error) {
    console.error('Error approving package:', error);
    res.status(500).json({ ok: false, msg: 'Approval failed' });
  }
});

export default router;