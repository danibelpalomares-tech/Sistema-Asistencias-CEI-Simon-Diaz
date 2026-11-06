const Model = require('tabla-model');

module.exports = new Model('usuarios', {
    colums: [
        { name: 'id', type: 'int', primary: true, autoincrement: true },
        { name: 'nombre', type: 'varchar(150)' },
        { name: 'email', type: 'varchar(150)', unique: true },
        { name: 'usuario', type: 'varchar(100)', unique: true },
        { name: 'password', type: 'varchar(255)' },
        { name: 'rol', type: 'varchar(50)', default: 'Administrador' },
        { name: 'foto', type: 'varchar(255)', default: '/uploads/admin/default-admin.png' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
    ]
});
