const rp = require('requestretry');
const colors = require('colors');
const _cliProgress = require('cli-progress');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const site = 'dostoprimechatelnosti';
const directory = `results/${site}`;
const filename = `results/${site}/list.json`;
const filenameMoscow = `${directory}/uniivers-moscow.json`;
const filenamePiter = `${directory}/uniivers-sp.json`;

const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);

const JsonSaver = async () => {
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


const GetFullPropertiesToJson = async (filetoSave) => {
    const file = fs.readFileSync(filename);
    const list = JSON.parse(file);
    bar.start(list.length, 0);

    fs.writeFile(filetoSave, '[', () => null);
    for (let i = 0; i < list.length; i++) {
        try {
            console.log(list[i].url.cyan.underline);
            const req = await rp({
                uri: list[i].url
            });

            if (req.body) {
                const $ = cheerio.load(req.body);
                const object = {
                    city: $('.choosecity span').eq(0).text().trim(),
                    name_short: $('.choosevuz span').eq(0).text().trim(),
                    name_long: $('.mainTitle').text().replace(/\s+/g,' ').trim(),
                    description: $('.midVuztext').text().replace(/\s+/g,' ').trim(),
                    contact: $('.specnoqqwe div').eq(1).text().trim(),
                    url: $('.specnoqqwe div').eq(3).text().trim(),
                };

                fs.appendFile(filetoSave, JSON.stringify(object, null, 4) + ',\n', () =>
                    console.log(`Successfully appended json`.yellow)
                );
            }

            bar.increment();
        } catch (e) {
            console.log(e);
        }
    }

    fs.appendFile(filetoSave, ']', () => console.log('Finished scrapping'.yellow));
    bar.stop();
};

const TestOne = async () => {
    try {
        const req = await rp({
            uri: `https://moscow.drugiegoroda.ru/attractions/3996-teremnoj-dvorec/`,
            attempts: 3
        });

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

        fs.mkdirSync(`${directory}/0`, {recursive: true});

        $('.bodycopy img').each((_, img) => {
            const src = `https:${$(img).attr('src')}`;
            const title = $(img).attr('alt');

            const splitUrl = src.split('/');
            const name = splitUrl[splitUrl.length - 1];

            const id = photos.findIndex((el) => el.name === name);
            if (id === -1) {
                photos.push({
                    title,
                    name
                });

                rp(src).pipe(fs.createWriteStream(`${directory}/0/${name}`));
            }
        });

        const object = {
            title,
            subtitle,
            description,
            workingTime,
            contacts,
            price,
            location,
            photos
        };

        console.log(object);
    } catch (e) {
        console.log(e);
    }
};

TestOne();
// JsonSaver();
// GetFullPropertiesToJson(filenamePiter);

