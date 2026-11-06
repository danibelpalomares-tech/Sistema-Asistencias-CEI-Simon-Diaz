const Model = require('tabla-model');

module.exports = new Model('empleados', {
    colums: [
        { name: 'id', type: 'int', primary: true, autoincrement: true },
        { name: 'tipo_cedula', type: 'varchar(2)', default: 'V' },
        { name: 'cedula', type: 'varchar(20)', unique: true },
        { name: 'nombres', type: 'varchar(100)' },
        { name: 'apellidos', type: 'varchar(100)' },
        { name: 'genero', type: 'varchar(20)' },
        { name: 'fecha_nacimiento', type: 'date' },
        { name: 'telefono', type: 'varchar(30)' },
        { name: 'email', type: 'varchar(150)' },
        { name: 'direccion', type: 'text' },
        { name: 'cargo', type: 'varchar(100)' },
        { name: 'estado', type: 'varchar(20)', default: 'Activo' },
        { name: 'nivel_academico', type: 'varchar(100)' },
        { name: 'fecha_ingreso', type: 'date' },
        { name: 'foto', type: 'varchar(255)', default: '/public/assets/default-avatar.png' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
    ]
});
