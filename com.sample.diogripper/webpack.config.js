const path = require("path");
const fs = require("fs-extra");
const AdmZip = require("adm-zip");

// initialize manifest.json for root
const rootManifestFileName = "manifest.json";
const rootManifest = require(`../${rootManifestFileName}`);
const pkgName = rootManifest.packageName;
const pkgVersion = rootManifest.version;
let dmFileName = `${pkgName}.dm`;
if (pkgVersion) {
    dmFileName = `${pkgName}_${pkgVersion}.dm`;
}

const assetDir = "assets";
const drscModulePkgFileName = rootManifest.drscModulePackageFile;
const drcfModulePkgFileName = rootManifest.drcfModulePackageFile;

// initialize manifest.json for DART-Platform
const manifestFileName = "manifest.json";
const manifest = require(`./${manifestFileName}`);

// initialize misc.
const rootDir = path.join(__dirname, "../");
const buildDir = path.join(__dirname, "build");
const buildPkgDir = path.join(buildDir, pkgName);
const outputDir = path.join(__dirname, "../../output");
const outputPkgDir = path.join(outputDir, pkgName);

function move(fileName, fromDir, toDir) {
    if (fileName && fileName.trim().length > 0 && fs.existsSync(path.join(fromDir, fileName))) {
        fs.moveSync(path.join(fromDir, fileName), path.join(toDir, fileName));
    }
}

function copy(fileName, fromDir, toDir) {
    if (fileName && fileName.trim().length > 0 && fs.existsSync(path.join(fromDir, fileName))) {
        fs.copySync(path.join(fromDir, fileName), path.join(toDir, fileName));
    }
}

function copyToDirPath(fileName, fromDir, toDirPath) {
    if (fileName && fileName.trim().length > 0 && fs.existsSync(path.join(fromDir, fileName))) {
        fs.copySync(path.join(fromDir, fileName), toDirPath);
    }
}

function remove(fileName, fromDir) {
    if (fileName && fileName.trim().length > 0 && fs.existsSync(path.join(fromDir, fileName))) {
        fs.removeSync(path.join(fromDir, fileName));
    }
}

class PackagingModulePackage {

    async packDrscModulePackage() {
        copyToDirPath("src/assets/images", __dirname, path.join(buildPkgDir, "assets/images"));
        copy(manifestFileName, __dirname, buildPkgDir);

        const zip = new AdmZip();
        zip.addLocalFolder(buildPkgDir);
        const dstName = path.join(buildDir, drscModulePkgFileName);
        await zip.writeZipPromise(dstName, null)
            .then(() => {
                console.log(`Successfully compress ${buildPkgDir} to ${dstName}.`)
            })
            .catch(e => {
                console.error(e);
            });
    }

    async packTotalModulePackage() {
        copy(assetDir, rootDir, outputPkgDir);
        copy(rootManifestFileName, rootDir, outputPkgDir);
        copy(drscModulePkgFileName, buildDir, outputPkgDir);
        copy(drcfModulePkgFileName, rootDir, outputPkgDir);

        const zip = new AdmZip();
        zip.addLocalFolder(outputPkgDir);
        const dstName = path.join(outputDir, dmFileName);
        await zip.writeZipPromise(dstName, null)
            .then(() => {
                remove(pkgName, outputDir)
                move(dmFileName, outputDir, outputPkgDir);
                console.log(`Successfully compress ${outputPkgDir} to ${dstName}.`)
            })
            .catch(e => {
                console.error(e);
            });
    }

    apply(compiler) {
        compiler.hooks.beforeCompile.tap("PackagingModulePackage", _ => {
            remove(pkgName, buildDir);
            remove(pkgName, outputDir);
            remove(dmFileName, outputDir);
        });
        compiler.hooks.done.tap("PackagingModulePackage", async _ => {
            await this.packDrscModulePackage()
                .then(async () => await this.packTotalModulePackage())
                .catch(e => console.error(e));
        });
    }
}

module.exports = {
    entry: {
        bundle: "./src/index.tsx"
    },
    output: {
        path: buildPkgDir,
        filename: manifest.main,
        assetModuleFilename: "assets/[name][ext]"
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    plugins: [new PackagingModulePackage()],
    module: {
        rules: [
            {
                test: /\.(m?jsx?)|(tsx?)$/,
                use: [{
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "@babel/preset-env",
                            "@babel/preset-react",
                            "@babel/preset-typescript"
                        ]
                    }
                }],
                exclude: /((node_modules\/(?!(dart-api)\/).*)|(bower_components))/,
            },
            {
                test: /\.(c|sc|sa)ss$/,
                use: ["style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            modules: {
                                localIdentHashSalt: pkgName
                            }
                        }
                    },
                    "sass-loader"
                ]
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/images/[name][ext]',
                }
            },
            {
                test: /\.svg$/,
                use: ['@svgr/webpack'],
            },
            {
                test: /\.json$/,
                use: ['json-loader'],
                type: 'javascript/auto'
            },
            {
                test: /\.drl$/,
                type: 'asset/resource',
            },
        ]
    }
};
