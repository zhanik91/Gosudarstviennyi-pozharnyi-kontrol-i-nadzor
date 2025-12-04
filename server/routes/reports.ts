import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';
import { orgScopeMiddleware } from '../services/authz';

const router = Router();

// Получаем организации для проверки области доступа
const getOrganizations = async () => {
  return await storage.getOrganizations();
};

// Получение статистических отчетов с проверкой организационной области
router.get('/api/reports', isAuthenticated, async (req: any, res) => {
  try {
    const organizations = await getOrganizations();
    const orgId = req.query.orgId || req.user.claims.sub;
    const includeChildren = req.query.includeChildren === 'true';
    const period = req.query.period;
    const form = req.query.form;

    // Проверка доступа к организации
    const { assertOrgScope, assertTreeAccess } = await import('../services/authz');
    
    try {
      assertOrgScope(organizations, req.user.orgId || req.user.claims.sub, orgId);
      
      if (includeChildren) {
        assertTreeAccess(req.user.role || 'editor');
      }
    } catch (error: any) {
      return res.status(403).json({ ok: false, msg: 'forbidden' });
    }

    // Получение данных отчета
    const reportData = await storage.getReportData({
      orgId,
      period,
      form,
      includeChildren
    });

    res.json({ ok: true, data: reportData });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ ok: false, msg: 'Internal server error' });
  }
});

// Получение статистики дашборда
router.get('/api/stats/dashboard', async (req, res) => {
  try {
    const stats = {
      incidents: await storage.getIncidentsCount(),
      objects: await storage.getObjectsCount(),
      reports: await storage.getReportsCount(),
      users: await storage.getUsersCount()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ ok: false, msg: 'Failed to fetch statistics' });
  }
});

// Валидация отчетов
router.get('/api/reports/validate', isAuthenticated, async (req: any, res) => {
  try {
    const organizations = await getOrganizations();
    const orgId = req.query.orgId || req.user.claims.sub;
    const period = req.query.period;

    // Проверка доступа
    const { assertOrgScope } = await import('../services/authz');
    
    try {
      assertOrgScope(organizations, req.user.orgId || req.user.claims.sub, orgId);
    } catch (error: any) {
      return res.status(403).json({ ok: false, msg: 'forbidden' });
    }

    const validationErrors = await storage.validateReports(orgId, period);
    res.json({ ok: true, errors: validationErrors });
  } catch (error) {
    console.error('Error validating reports:', error);
    res.status(500).json({ ok: false, msg: 'Validation failed' });
  }
});

export default router;