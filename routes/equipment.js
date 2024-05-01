const express = require("express");
const router = express.Router();
const equipmentController = require("../controllers/equipmentController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const equipmentRoutes = [
  {
    method: METHOD.GET,
    path: PATH.EQUIPMENTS,
    roles: [ROLE.ADMIN],
    handler: equipmentController.getAllEquipments,
  },
  {
    method: METHOD.GET,
    path: PATH.EQUIPMENT_ID,
    roles: [ROLE.ADMIN],
    handler: equipmentController.getSingleEquipment,
  },
  {
    method: METHOD.POST,
    path: PATH.EQUIPMENTS,
    roles: [ROLE.ADMIN],
    handler: equipmentController.createNewEquipment,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_EQUIPMENT_ID,
    roles: [ROLE.ADMIN],
    handler: equipmentController.updateEquipment,
  },
  {
    method: METHOD.DELETE,
    path: PATH.EQUIPMENT_ID,
    roles: [ROLE.ADMIN],
    handler: equipmentController.deleteEquipment,
  },
];

equipmentRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
