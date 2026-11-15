const { Op } = require('sequelize');
const { MasterBank, MasterDepartment, MasterDesignation } = require('../models');

const configs = {
  banks: { model: MasterBank },
  departments: { model: MasterDepartment },
  designations: { model: MasterDesignation },
};

function getConfig(type) {
  return configs[String(type || '').toLowerCase()];
}

function validateName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 100 || /[\u0000-\u001f]/.test(name)) return null;
  return name;
}

function designationInclude() {
  return [{ model: MasterDepartment, as: 'department', attributes: ['id', 'name'] }];
}

exports.listAdminMasters = async (_req, res) => {
  try {
    const [banks, departments, designations] = await Promise.all([
      MasterBank.findAll({ order: [['name', 'ASC']] }),
      MasterDepartment.findAll({ order: [['name', 'ASC']] }),
      MasterDesignation.findAll({ include: designationInclude(), order: [['name', 'ASC']] }),
    ]);
    return res.status(200).json({ success: true, data: { banks, departments, designations } });
  } catch (error) {
    console.error('List master data error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load master data.' });
  }
};

exports.listCompanyMasters = async (_req, res) => {
  try {
    const where = { status: 'active' };
    const [banks, departments, designations] = await Promise.all([
      MasterBank.findAll({ where, attributes: ['id', 'name'], order: [['name', 'ASC']] }),
      MasterDepartment.findAll({ where, attributes: ['id', 'name'], order: [['name', 'ASC']] }),
      MasterDesignation.findAll({ where, attributes: ['id', 'name', 'department_id'], include: designationInclude(), order: [['name', 'ASC']] }),
    ]);
    return res.status(200).json({ success: true, data: { banks, departments, designations } });
  } catch (error) {
    console.error('List company master data error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load employee form options.' });
  }
};

exports.createMaster = async (req, res) => {
  const config = getConfig(req.params.type);
  const name = validateName(req.body.name);
  if (!config) return res.status(404).json({ success: false, message: 'Unknown master type.' });
  if (!name) return res.status(400).json({ success: false, message: 'A name of 1 to 100 characters is required.' });

  try {
    const values = { name, status: 'active' };
    if (req.params.type === 'departments' || req.params.type === 'designations') {
      const description = String(req.body.description || '').trim();
      if (description.length > 255) return res.status(400).json({ success: false, message: 'Description must not exceed 255 characters.' });
      values.description = description || null;
    }
    if (req.params.type === 'designations') {
      const departmentId = req.body.department_id ? Number(req.body.department_id) : null;
      if (departmentId !== null) {
        if (!Number.isSafeInteger(departmentId) || departmentId < 1 || !(await MasterDepartment.findByPk(departmentId))) {
          return res.status(400).json({ success: false, message: 'Select a valid department.' });
        }
      }
      values.department_id = departmentId;
    }
    const duplicateWhere = req.params.type === 'designations' ? { name, department_id: values.department_id } : { name };
    if (await config.model.findOne({ where: duplicateWhere })) {
      return res.status(409).json({ success: false, message: 'This master entry already exists.' });
    }
    const record = await config.model.create(values);
    const created = req.params.type === 'designations'
      ? await config.model.findByPk(record.id, { include: designationInclude() })
      : record;
    return res.status(201).json({ success: true, message: 'Master entry created.', data: created });
  } catch (error) {
    console.error('Create master entry error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create the master entry.' });
  }
};

exports.updateMaster = async (req, res) => {
  const config = getConfig(req.params.type);
  const name = validateName(req.body.name);
  const id = Number(req.params.id);
  if (!config) return res.status(404).json({ success: false, message: 'Unknown master type.' });
  if (!Number.isSafeInteger(id) || id < 1 || !name) return res.status(400).json({ success: false, message: 'A valid id and name are required.' });

  try {
    const record = await config.model.findByPk(id);
    if (!record) return res.status(404).json({ success: false, message: 'Master entry not found.' });
    const values = { name };
    if (req.params.type !== 'banks') {
      const description = String(req.body.description || '').trim();
      if (description.length > 255) return res.status(400).json({ success: false, message: 'Description must not exceed 255 characters.' });
      values.description = description || null;
    }
    if (req.params.type === 'designations') {
      const departmentId = req.body.department_id ? Number(req.body.department_id) : null;
      if (departmentId !== null && (!Number.isSafeInteger(departmentId) || departmentId < 1 || !(await MasterDepartment.findByPk(departmentId)))) {
        return res.status(400).json({ success: false, message: 'Select a valid department.' });
      }
      values.department_id = departmentId;
    }
    const duplicateWhere = req.params.type === 'designations' ? { name, department_id: values.department_id, id: { [Op.ne]: id } } : { name, id: { [Op.ne]: id } };
    if (await config.model.findOne({ where: duplicateWhere })) return res.status(409).json({ success: false, message: 'This master entry already exists.' });
    await record.update(values);
    const updated = req.params.type === 'designations'
      ? await config.model.findByPk(id, { include: designationInclude() })
      : record;
    return res.status(200).json({ success: true, message: 'Master entry updated.', data: updated });
  } catch (error) {
    console.error('Update master entry error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update the master entry.' });
  }
};

exports.updateMasterStatus = async (req, res) => {
  const config = getConfig(req.params.type);
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!config) return res.status(404).json({ success: false, message: 'Unknown master type.' });
  if (!Number.isSafeInteger(id) || id < 1 || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'A valid id and status are required.' });
  }
  try {
    const record = await config.model.findByPk(id);
    if (!record) return res.status(404).json({ success: false, message: 'Master entry not found.' });
    await record.update({ status });
    return res.status(200).json({ success: true, message: `Master entry ${status}.`, data: record });
  } catch (error) {
    console.error('Update master status error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update master status.' });
  }
};

exports.deleteMaster = async (req, res) => {
  const config = getConfig(req.params.type);
  const id = Number(req.params.id);
  if (!config) return res.status(404).json({ success: false, message: 'Unknown master type.' });
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ success: false, message: 'A valid master entry id is required.' });
  try {
    const record = await config.model.findByPk(id);
    if (!record) return res.status(404).json({ success: false, message: 'Master entry not found.' });
    await record.destroy();
    return res.status(200).json({ success: true, message: 'Master entry deleted.', data: { id } });
  } catch (error) {
    console.error('Delete master entry error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete the master entry.' });
  }
};
