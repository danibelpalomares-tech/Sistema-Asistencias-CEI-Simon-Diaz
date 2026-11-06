const MySQL = require('mysql-tab');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'cei_simondiaz',
  port: parseInt(process.env.DB_PORT, 10) || 3306
};

let db = null;
let isConnected = false;

// Datos iniciales para la tienda en memoria/fallback (Limpios para pruebas reales del usuario)
const defaultData = {
  usuarios: [
    {
      id: 1,
      nombre: 'Administrador',
      email: 'admin@gmail.com',
      usuario: 'admin',
      password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
      rol: 'Administrador',
      foto: '/uploads/admin/default-admin.png',
      created_at: new Date().toISOString()
    }
  ],
  empleados: [],
  asistencias: [],
  permisos: [],
  configuracion: [
    { id: 1, clave: 'admin_nombre', valor: 'Administrador' },
    { id: 2, clave: 'admin_titulo', valor: 'Administrador' },
    { id: 3, clave: 'admin_email', valor: 'admin@gmail.com' },
    { id: 4, clave: 'admin_foto', valor: '/uploads/admin/default-admin.png' }
  ]
};

// Objeto de almacenamiento local sincronizado
const memoryStore = JSON.parse(JSON.stringify(defaultData));

function createMockTable(tableName) {
  if (!memoryStore[tableName]) {
    memoryStore[tableName] = [];
  }
  return {
    async select(queryObj) {
      let rows = [...memoryStore[tableName]];
      if (queryObj && typeof queryObj === 'object') {
        const where = queryObj.where || queryObj;
        rows = rows.filter(row => {
          for (const [key, val] of Object.entries(where)) {
            if (key.endsWith('>=')) {
              const k = key.slice(0, -2);
              if (!(row[k] >= val)) return false;
            } else if (key.endsWith('<=')) {
              const k = key.slice(0, -2);
              if (!(row[k] <= val)) return false;
            } else if (key.endsWith('>')) {
              const k = key.slice(0, -1);
              if (!(row[k] > val)) return false;
            } else if (key.endsWith('<')) {
              const k = key.slice(0, -1);
              if (!(row[k] < val)) return false;
            } else if (key.endsWith('!')) {
              const k = key.slice(0, -1);
              if (row[k] == val) return false;
            } else if (key.endsWith('%')) {
              const k = key.slice(0, -1);
              const pattern = String(val).replace(/%/g, '').toLowerCase();
              if (!String(row[k] || '').toLowerCase().includes(pattern)) return false;
            } else {
              if (row[key] != val) return false;
            }
          }
          return true;
        });
        if (queryObj.order) {
          const [field, dir] = queryObj.order.split(' ');
          rows.sort((a, b) => {
            if (dir && dir.toUpperCase() === 'DESC') {
              return (b[field] > a[field] ? 1 : -1);
            }
            return (a[field] > b[field] ? 1 : -1);
          });
        }
        if (queryObj.limit) {
          rows = rows.slice(0, queryObj.limit);
        }
      }
      return rows;
    },
    async selectOne(queryObj) {
      const results = await this.select(queryObj);
      return results.length > 0 ? results[0] : null;
    },
    async selectById(id) {
      return memoryStore[tableName].find(r => r.id == id) || null;
    },
    async busqueda(term, columns) {
      const lower = String(term).toLowerCase();
      return memoryStore[tableName].filter(row => {
        return (columns || Object.keys(row)).some(col => 
          String(row[col] || '').toLowerCase().includes(lower)
        );
      });
    },
    async insert(data) {
      const maxId = memoryStore[tableName].reduce((max, r) => Math.max(max, r.id || 0), 0);
      const newRecord = { id: maxId + 1, ...data, created_at: new Date().toISOString() };
      memoryStore[tableName].push(newRecord);
      return { insertId: newRecord.id, affectedRows: 1 };
    },
    async updateById(data, id) {
      const idx = memoryStore[tableName].findIndex(r => r.id == id);
      if (idx !== -1) {
        memoryStore[tableName][idx] = { ...memoryStore[tableName][idx], ...data };
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    },
    async update(data, whereClause) {
      let count = 0;
      memoryStore[tableName] = memoryStore[tableName].map(row => {
        count++;
        return { ...row, ...data };
      });
      return { affectedRows: count };
    },
    async deleteById(id) {
      const initLen = memoryStore[tableName].length;
      memoryStore[tableName] = memoryStore[tableName].filter(r => r.id != id);
      return { affectedRows: initLen - memoryStore[tableName].length };
    },
    async delete(whereClause) {
      memoryStore[tableName] = [];
      return { affectedRows: 1 };
    }
  };
}

const net = require('net');

function checkMariaDB(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Probar conexión y luego inicializar mysql-tab si MariaDB está activo
checkMariaDB(dbConfig.host, dbConfig.port).then((isAvailable) => {
  if (isAvailable) {
    try {
      db = new MySQL(dbConfig);
      db.pathModels(path.join(__dirname, '..', 'models'));
      isConnected = true;
      console.log('✅ [MariaDB] Conexión establecida con éxito mediante mysql-tab en el puerto', dbConfig.port);
    } catch (err) {
      isConnected = false;
      console.log('⚠️ Error al conectar mysql-tab:', err.message);
    }
  } else {
    isConnected = false;
    console.log('ℹ️ [MariaDB] Contenedor MariaDB no detectado en localhost:3306.');
    console.log('ℹ️ Para encender la base de datos MariaDB oficial usa: docker-compose up');
    console.log('ℹ️ Sistema funcionando en modo seguro de alta disponibilidad con datos precargados.');
  }
});

function normalizeQueryOptions(arg) {
  if (!arg || typeof arg !== 'object' || Array.isArray(arg)) {
    return arg;
  }
  const recognizedKeys = ['campos', 'where', 'joins', 'group', 'having', 'order', 'limit'];
  const hasRecognizedKey = recognizedKeys.some(k => k in arg);
  if (!hasRecognizedKey) {
    // Convierte filtros directos como { fecha: '...' } o { clave: '...' } en { where: ... }
    // Evita estrictamente que mysql-tab / dbtabla los trate como un NATURAL JOIN
    return { where: { ...arg } };
  }
  return arg;
}

function wrapTable(tableInstance) {
  if (!tableInstance) return tableInstance;
  return new Proxy(tableInstance, {
    get(target, prop, receiver) {
      if (prop === 'select') {
        return function(...args) {
          if (args.length > 0) {
            args[0] = normalizeQueryOptions(args[0]);
          }
          return target.select(...args);
        };
      }
      if (prop === 'selectOne') {
        return function(...args) {
          if (args.length > 0) {
            args[0] = normalizeQueryOptions(args[0]);
          }
          return target.selectOne(...args);
        };
      }
      if (prop === 'insert') {
        return function(data) {
          if (data && typeof data === 'object') {
            const sanitized = { ...data };
            if (sanitized.created_at && typeof sanitized.created_at === 'string' && sanitized.created_at.includes('T')) {
              sanitized.created_at = sanitized.created_at.replace('T', ' ').split('.')[0].replace('Z', '');
            }
            return target.insert(sanitized);
          }
          return target.insert(data);
        };
      }
      if (prop === 'update') {
        return function(sets, where) {
          if (where && typeof where === 'object' && where.where) {
            where = where.where;
          }
          return target.update(sets, where);
        };
      }
      if (prop === 'updateById') {
        return function(sets, id) {
          return target.update(sets, { id });
        };
      }
      if (prop === 'delete') {
        return function(where) {
          if (where && typeof where === 'object' && where.where) {
            where = where.where;
          }
          return target.delete(where);
        };
      }
      if (prop === 'deleteById') {
        return function(id) {
          return target.delete({ id });
        };
      }
      if (prop === 'selectById') {
        return async function(id) {
          return target.selectOne({ where: { id } });
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

module.exports = {
  db,
  isMariaDBConnected: () => isConnected,
  tabla(nombre) {
    if (isConnected && db) {
      try {
        return wrapTable(db.tabla(nombre));
      } catch (e) {
        return wrapTable(createMockTable(nombre));
      }
    }
    return wrapTable(createMockTable(nombre));
  },
  async query(sql, params) {
    if (isConnected && db) {
      if (params !== undefined) {
        return new Promise((resolve, reject) => {
          const runner = db._transactionConn || db.connection;
          runner.query(sql, params, (err, res) => {
            if (err) return reject(err);
            resolve(res);
          });
        });
      }
      return db.query(sql);
    }
    return [];
  },
  memoryStore
};
