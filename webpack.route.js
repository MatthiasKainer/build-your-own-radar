const fs = require("fs");
const path = require("path")

function route(middlewares, devServer) {
    if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
    }

    devServer.app.get(/.*\.csvf$/, function (req, res) {
        const location = path.parse(req.path)
        const root = path.join("./dist", decodeURI(location.dir), decodeURI(location.name))
        fs.readdir(root, (err, files) => {
            if (err) return res.send(err)
            Promise.all(files.filter(file => file.endsWith(".csv")).map(file => new Promise((resolve, reject) => {
                fs.readFile(path.join(root, file), { encoding: "utf8" }, (err, data) => {
                    if (err) reject(err)
                    else resolve(data)
                })
            })))
                .then(files => files.join("\n"))
                .then(file => res.send(file))
        })
    });
    return middlewares;
}

module.exports = route