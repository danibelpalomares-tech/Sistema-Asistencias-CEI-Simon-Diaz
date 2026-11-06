const Model = require('tabla-model');

const ConfiguracionModel = new Model('configuracion', {
    colums: [
        { name: 'id', type: 'int', primary: true, autoincrement: true },
        { name: 'clave', type: 'varchar(50)', unique: true },
        { name: 'valor', type: 'text' }
    ]
});

// Métodos del modelo para consultas seguras en MariaDB (evitan NATURAL JOIN en columna 'clave')
ConfiguracionModel.method('obtenerPorClave', function(dbTabla, clave) {
    return dbTabla.selectOne({ where: { clave } });
});

ConfiguracionModel.method('guardarClave', function(dbTabla, clave, valor) {
    return dbTabla.update({ valor }, { clave });
});

module.exports = ConfiguracionModel;
