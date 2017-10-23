const { create_directories, getpath, exist, loadfile, md5hash } = require('./util'),
    fs = require('fs');
var config = null;
try {
    config = require('./dev-config')
} catch (e) {
    config = require('./config');
}

create_directories(['','modpacks','mods']);

function mod(name) {
    var m = loadfile('mods', name, 'mod.json');
    var v = [];
    if (fs.existsSync(getpath('mods', name, 'versions')))
        fs.readdirSync(getpath('mods', name, 'versions')).forEach(x => {
            v.push(x.replace(/\.jar$|\.zip$/g,''));
        });
    m['versions'] = v;
    return m;
}

function ver(name, version, ext) {
    var v = 'mods/'+name+'/versions/'+version+'.'+ext;
    return {
        md5: md5hash(config.data+v),
        url: config.addr+v
    };
}

function modpack(slug) {
    var m = loadfile('modpacks', slug, 'modpack.json');
    var b = [];
    if (exist('modpacks', slug, 'builds'))
        fs.readdirSync(getpath('modpacks', slug, 'builds')).forEach(x => {
            b.push(x.replace(/\.json$/g,''));
        });
    m['builds'] = b;
    if (exist('modpacks', slug, 'icon.png')) {
        m['icon'] = config.addr + 'resources/'+slug+'/icon.png';
        m['icon_md5'] = md5hash(getpath('modpacks', slug, 'icon.png'));
    }
    if (exist('modpacks', slug, 'logo.png')) {
        m['logo'] = config.addr + 'resources/'+slug+'/logo.png';
        m['logo_md5'] = md5hash(getpath('modpacks', slug, 'logo.png'));
    }
    if (exist('modpacks', slug, 'background.png')) {
        m['background'] = config.addr + 'resources/'+slug+'/background.png';
        m['background_md5'] = md5hash(getpath('modpacks', slug, 'background.png'));
    }
    return m;
}

function buil(slug, build) {
    var b = loadfile('modpacks', slug, 'builds', build+'.json');
    var m = b.mods;
    var n = [];
    m.forEach(x => {
        var ext = 'jar';
        if (exist('mods', x.name, 'versions', x.version+'.zip')) ext = 'zip';
        var v = 'mods/'+x.name+'/versions/'+x.version+'.'+ext;
        n.push({
            name: x.name,
            version: x.version,
            md5: md5hash(config.data+v),
            url: config.addr+v
        });
    });
    b['mods'] = n;
    return b;
}

module.exports = {
    config,
    modpack_full: () => {
        return new Promise((resolve, reject) => {
            var modpacks = {};
            fs.readdirSync(getpath('modpacks')).forEach(x => {
                modpacks[x] = modpack(x);
            });
            resolve({
                modpacks,
                mirror_url: 'http://mirror.technicpack.net/Technic/'
            });
        });
    },
    modpack: (slug, build) => {
        return new Promise((resolve, reject) => {
            if (slug) {
                if (build) {
                    if (exist('modpacks', slug, 'builds', build+'.json')) {
                        resolve(buil(slug, build));
                    } else {
                        resolve({
                            error: 'Build does not exist!'
                        });
                    }
                } else {
                    if (exist('modpacks', slug)) {
                        resolve(modpack(slug));
                    } else {
                        resolve({
                            error: 'Modpack does not exist!'
                        });
                    }
                }
            } else {
                var modpacks = {};
                fs.readdirSync(getpath('modpacks')).forEach(x => {
                    modpacks[x] = loadfile('modpacks', x, 'modpack.json')['display_name'];
                });
                resolve({
                    modpacks,
                    mirror_url: 'http://mirror.technicpack.net/Technic/'
                });
            }
        });
    },
    mod: (name, version) => {
        return new Promise((resolve, reject) => {
            if (name) {
                if (version) {
                    if (exist('mods', name, 'versions', version+'.jar')) {
                        resolve(ver(name, version, 'jar'));
                    } else if (exist('mods', name, 'versions', version+'.zip')) {
                        resolve(ver(name, version, 'zip'));
                    } else {
                        resolve({
                            error: 'Mod version does not exist!'
                        });
                    }
                } else {
                    if (exist('mods', name)) {
                        resolve(mod(name));
                    } else {
                        resolve({
                            error: 'Mod does not exist!'
                        });
                    }
                }
            } else {
                resolve({
                    error: 'No mod requested'
                });
            }
        });
    }
};