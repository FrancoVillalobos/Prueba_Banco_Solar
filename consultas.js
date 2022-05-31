const { Pool } = require("pg");
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    password: "admin",
    port: 5432,
    database: "repertorio",
    max: 20,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 2000
});

//Función insertar datos de agregar nuevo usuario
const insertar = async (datos) => {
    console.log(datos);
    const consulta = {
        text: "INSERT INTO usuarios(nombre, balance) VALUES ($1, $2)",
        values: datos
    }
    try {
        const result = await pool.query(consulta)
        return result
    } catch (e) {
        console.log("Código de error: " + e.code)
        return e
    }
}

// Función para consultar usuarios en la BD
const consultarUsuarios = async () => {
    const consulta = {
        text: "SELECT * FROM usuarios ORDER BY nombre",
    }
    try {
        const result = await pool.query(consulta)
        return result
    } catch (e) {
        console.log("Error al consultar los usuarios. Cádigo: " + e.code)
        return e
    }
}

//Función que modifica datos de usuarios de la BD
const modificarUsuarios = async (datos, id) => {
    const consulta = {
        text: `UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = ${id} RETURNING*`,
        values: datos
    }
    try {
        const result = await pool.query(consulta)
        console.log(`El usuario con id ${id} ha sido modificado`)
        return result
    } catch (e) {
        console.log("Error al modificar el usuario. Código: " + e.code)
    }
}

// función que elimina usuarios de la BD
const eliminarUsuarios = async (id) => {
    const consulta1 = {
        text: `DELETE FROM transferencias WHERE emisor = ${id}`
    }
    const consulta2 = {
        text: `DELETE FROM transferencias WHERE receptor = ${id}`
    }

    const consulta3 = {
        text: `DELETE FROM usuarios WHERE id = ${id}`
    }

    try {
        const result = await pool.query(consulta1)
        const result2 = await pool.query(consulta2)
        const result3 = await pool.query(consulta3)
        console.log(`El usuario con id "${id}" ha sido eliminado y todas sus transferencias`)
        return result3
    } catch (e) {
        console.log(`Error al eliminar el usuario con id "${id}". Código: ${e.code}`)
    }
}

//Función que registra las transferencias entre usuarios
const transferir = async (datos) => {
    try {
        await pool.query("BEGIN")
        const descontar = {
            text: `UPDATE usuarios SET balance = balance - ${datos[2]} WHERE nombre = '${datos[0]}' RETURNING*`
        }
        const descontando = await pool.query(descontar)
        const acreditar = {
            text: `UPDATE usuarios SET balance = balance + ${datos[2]} WHERE nombre = '${datos[1]}' RETURNING*`
        }
        const acreditacion = await pool.query(acreditar)
        console.log(`El usuario "${datos[0]}" ha transferido un monto de "$${datos[2]}" al usuario "${datos[1]}"`)

        const registrarTabla = {
            text: "INSERT INTO transferencias(emisor, receptor, monto, fecha) VALUES($1, $2, $3, $4)",
            values: [descontando.rows[0].id, acreditacion.rows[0].id, datos[2], new Date]
        }
        await pool.query(registrarTabla)
        await pool.query("COMMIT")
        const data = [descontando.rows[0].nombre, acreditacion.rows[0].nombre, datos[2], new Date]
        return data

    } catch (e) {
        await pool.query("ROLLBACK")
        console.log("Ha habido un error con la transferencia: ", e.code)
        return e
    }
}

//Función que hace una consulta con subquery para traer los datos de fecha, emisor, receptor y monto
const consultarTransferencias = async () => {
    const consulta = {
        rowMode: "array",
        text: "SELECT fecha, (SELECT usuarios.nombre FROM usuarios WHERE transferencias.emisor = usuarios.id) as emisor, usuarios.nombre as receptor, transferencias.monto FROM usuarios INNER JOIN transferencias ON transferencias.receptor = usuarios.id ORDER BY fecha DESC;",
    };
    try {
        const result = await pool.query(consulta)
        return result
    } catch (e) {
        console.log("Error al consultar las transferencias. Código: " + e.code)
        return e
    }
}

module.exports = { insertar, consultarUsuarios, modificarUsuarios, eliminarUsuarios, transferir, consultarTransferencias }