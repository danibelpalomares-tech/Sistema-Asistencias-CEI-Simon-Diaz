const Model = require('tabla-model');

const AsistenciaModel = new Model('asistencias', {
    colums: [
        { name: 'id', type: 'int', primary: true, autoincrement: true },
        { name: 'id_empleado', type: 'int' },
        { name: 'fecha', type: 'date' },
        { name: 'hora_entrada', type: 'time' },
        { name: 'hora_salida', type: 'time' },
        { name: 'estado', type: 'varchar(50)', default: 'Presente' },
        { name: 'observaciones', type: 'text' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
    ],
    foreignKey: [
        { key: 'id_empleado', reference: 'empleados', keyReference: 'id' }
    ]
});

// Métodos del modelo para consultas seguras en MariaDB (evitan NATURAL JOIN en columna 'fecha')
AsistenciaModel.method('porFecha', function(dbTabla, fecha) {
    return dbTabla.select({ where: { fecha } });
});

AsistenciaModel.method('porEmpleadoYFecha', function(dbTabla, id_empleado, fecha) {
    return dbTabla.select({ where: { id_empleado, fecha } });
});

module.exports = AsistenciaModel;
