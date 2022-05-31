const http = require("http")
const url = require("url")
const fs = require("fs")
const { insertar, consultarUsuarios, modificarUsuarios, eliminarUsuarios,
    transferir, consultarTransferencias } = require("./consultas")

http.createServer(async (req, res) => {

    // preparando ruta raíz para lectura de HTML
    if (req.url == "/" && req.method === "GET") {
        res.setHeader("Content-Type", "text/html");
        const html = fs.readFileSync("index.html", "utf8");
        res.statusCode = 200
        res.end(html)
    }

    // preparando ruta /usuarios para lectura de usuarios en base de dato
    if (req.url.includes("/usuarios") && req.method === "GET") {
        try {
            const respuesta = await consultarUsuarios()
            res.statusCode = 200
            res.end(JSON.stringify(respuesta.rows))

        } catch (e) {
            console.log("Hay un error con la ruta de los usuarios en la BD: ", e.code)
            res.statusCode = 404
            res.end()
        }
    }

    // preparando ruta /usuario para la inserción de datos en la base de datos
    if (req.url.includes("/usuario") && req.method === "POST") {
        try {
            let body = ""
            req.on("data", (chunk) => {
                body += chunk
            })
            req.on("end", async () => {
                const datos = Object.values(JSON.parse(body))
                const respuesta = await insertar(datos)
                res.statusCode = 201
                res.end(JSON.stringify(respuesta))
            });
        } catch (e) {
            console.log("Error al crear los usuarios. Código: ", e.code)
            res.statusCode = 400
            res.end()
        }
    }

    // preparando ruta /usuario con metodo PUT para la modificación de usuarios
    if (req.url.startsWith("/usuario") && req.method === "PUT") {
        const { id } = url.parse(req.url, true).query;
        try {
            let body = ""
            req.on("data", (chunk) => {
                body += chunk
            })
            req.on("end", async () => {
                const datos = Object.values(JSON.parse(body))
                const respuesta = await modificarUsuarios(datos, id)
                res.statusCode = 201
                res.end(JSON.stringify(respuesta))
            })

        } catch (e) {
            console.log("Error al tratar de modificar un usuario. Código: ", e.code)
            res.statusCode = 400
            res.end()
        }
    }

    // preparando ruta /usuario para borrar usuarios de base de datos
    if (req.url.startsWith("/usuario") && req.method === "DELETE") {
        const { id } = url.parse(req.url, true).query;
        try {
            const respuesta = await eliminarUsuarios(id)
            res.statusCode = 202
            res.end(JSON.stringify(respuesta))

        } catch (e) {
            console.log("Error eliminando al usuario. Código: ", e.code)
            res.statusCode = 400
            res.end()
        }
    }

    // preparando ruta /transferencia con metodo POST para la realización de transferencias en la base de datos
    if (req.url.includes("/transferencia") && req.method === "POST") {
        try {
            let body = ""
            req.on("data", (chunk) => {
                body += chunk
            })

            req.on("end", async () => {
                const datos = Object.values(JSON.parse(body))
                const respuesta = await transferir(datos)
                res.statusCode = 201
                res.end(JSON.stringify(respuesta))
            })

        } catch (e) {
            console.log("Error en la transferencia. Código: ", e.code)
            res.statusCode = 400
            res.end()
        }
    }

    // preparando la ruta /transferencias con metodo GET para el registro de las transferencias realizadas
    if (req.url.includes("/transferencias") && req.method === "GET") {
        try {
            const respuesta = await consultarTransferencias()
            res.statusCode = 200
            res.end(JSON.stringify(respuesta.rows))
            //console.log(respuesta.rows);

        } catch (e) {
            console.log("Error al consultar las transacciones. Código: ", e.code)
            res.statusCode = 404
            res.end()
        }
    }

}).listen(3000, console.log("Servidor corriendo en http://localhost:3000/"))