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
      status: 'consolidated'
    });

    // Логируем действие
    await storage.createAuditLog({
      userId: req.user.claims.sub,
      action: 'PACKAGE_CONSOLIDATE',
      objectType: 'package',
      objectId: consolidatedPackage.id,
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
    const returnedPackage = await storage.updatePackage(packageId, {
      status: 'returned',
      returnReason: reason,
      returnComment: comment,
      returnedBy: req.user.claims.sub,
      returnedAt: new Date()
    });

    // Отправляем уведомление
    const packageOwner = await storage.getUser(returnedPackage.createdBy);
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
      objectType: 'package',
      objectId: packageId,
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
      approvalComment: comment,
      approvedBy: req.user.claims.sub,
      approvedAt: new Date()
    });

    // Отправляем уведомление
    const packageOwner = await storage.getUser(approvedPackage.createdBy);
    if (packageOwner?.email) {
      await emailService.sendPackageApprovalNotification(
        packageOwner.email,
        {
          period: approvedPackage.period,
          approverName: user?.firstName + ' ' + user?.lastName
        }
      );
    }

    // Логируем действие
    await storage.createAuditLog({
      userId: req.user.claims.sub,
      action: 'PACKAGE_APPROVE',
      objectType: 'package',
      objectId: packageId,
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