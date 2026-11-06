const Model = require('tabla-model');

const PermisoModel = new Model('permisos', {
    colums: [
        { name: 'id', type: 'int', primary: true, autoincrement: true },
        { name: 'id_empleado', type: 'int' },
        { name: 'tipo', type: 'varchar(50)' },
        { name: 'fecha_inicio', type: 'date' },
        { name: 'fecha_fin', type: 'date' },
        { name: 'motivo', type: 'text' },
        { name: 'archivo_adjunto', type: 'varchar(255)' },
        { name: 'estado', type: 'varchar(50)', default: 'Aprobado' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
    ],
    foreignKey: [
        { key: 'id_empleado', reference: 'empleados', keyReference: 'id' }
    ]
});

module.exports = PermisoModel;
