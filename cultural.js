const rp = require('requestretry');
const colors = require('colors');
const _cliProgress = require('cli-progress');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const site = 'dostoprimechatelnosti';
const directory = `results/${site}`;
const filename = `results/${site}/list.json`;
const fullListFile = `results/${site}/full-list.json`;

const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);

const getListOfObjects = async () => {
    bar.start(29 * 20, 0);

    const list = [];
    let j = 0;

    for (let i = 1; i <= 29; i++) {
        try {
            const req = await rp({
                uri: `https://moscow.drugiegoroda.ru/category/uznaj-moskvu/dostoprimechatelnosti/?page=${i}`
            });
            const $ = cheerio.load(req.body);

            $('article').each((_, item) => {
                const a = $(item).find('a').first();
                const title = $(item).find('.entry-title');

                const object = {
                    id: ++j,
                    title: title.text().trim(),
                    url: a.attr('href'),
                };

                list.push(object);
                bar.increment();
            });
        } catch (e) {
            console.log(e);
        }
    }

    fs.writeFile(filename, JSON.stringify(list, null, 4), () => null);
    bar.stop();
};


const GetFullPropertiesToJson = async () => {
    const file = fs.readFileSync(filename);
    const list = JSON.parse(file);
    bar.start(list.length, 97);

    for (let i = 97; i < list.length; i++) {
        try {
            const {url, id} = list[i];
            console.log(url.cyan.underline);

            const req = await rp({
                uri: url
            });

            if (req.body) {
                const $ = cheerio.load(req.body);

                let title = $('.heading h1').text().trim();
                let subtitle = $('.heading p').first().text().trim();

                let description = '';
                let workingTime = '';
                let contacts = '';
                let price = '';
                let location = '';
                const photos = [];

                $('.bodycopy p').each((_, p) => description += $(p).text().trim() + '\n');

                const getNextText = (el) => $(el).next().text().trim();

                $('.additions h2').each((_, h2) => {
                    const header = $(h2).text().toLowerCase().replace(/\s+/g, '');
                    switch (header) {
                        case 'часыработы': workingTime = getNextText(h2); break;
                        case 'адресиконтакты': contacts = getNextText(h2); break;
                        case 'стоимостьпосещения': price = getNextText(h2); break;
                        case 'pacположение': location = getNextText(h2); break;
                    }
                });

                const dir = `${directory}/${id}`;
                fs.mkdirSync(dir, {recursive: true});

                $('.bodycopy img').each((_, img) => {
                    let src = $(img).attr('src');
                    if (src.substr(0, 2) === '//') {
                        src = `https:${src}`;
                    }

                    if (!/^https?:\/\//.test(src)) {
                        return;
                    }

                    const title = $(img).attr('alt');
                    const splitUrl = src.split('/');
                    const name = splitUrl[splitUrl.length - 1];

                    if (name.includes('pinit') || !title || src.includes('maps')) {
                        return;
                    }

                    const id = photos.findIndex((el) => el.name === name);
                    if (id === -1) {
                        photos.push({
                            title,
                            name
                        });

                        try {
                            rp(src).pipe(fs.createWriteStream(`${dir}/${name}`));
                        } catch (e) {
                            console.error(`failed to get image ${name}`)
                        }
                    }
                });

                const object = {
                    id,
                    url,
                    title,
                    subtitle,
                    description,
                    workingTime,
                    contacts,
                    price,
                    location,
                    photos
                };

                fs.writeFile(`${dir}/info.json`, JSON.stringify(object, null, 4), () => null);
            }

            bar.increment();
        } catch (e) {
            console.log(e);
        }
    }

    bar.stop();
};

const collectToOneFile = () => {
    const file = fs.readFileSync(filename);
    const list = JSON.parse(file);
    bar.start(list.length, 0);

    const objects = [];

    for (let i = 0; i < list.length; i++) {
        const {id} = list[i];
        const objectJson = fs.readFileSync(`${directory}/${id}/info.json`);
        const object = JSON.parse(objectJson);

        objects.push(object);
        bar.increment();
    }

    fs.writeFile(fullListFile, JSON.stringify(objects, null, 4), () => null);
    bar.stop();
};

const TestOne = async () => {
    try {
        // TO-OO get from above
    } catch (e) {
        console.log(e);
    }
};

// TestOne();
// getListOfObjects();
// GetFullPropertiesToJson();
collectToOneFile();
