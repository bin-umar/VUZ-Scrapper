const rp = require('requestretry');
const colors = require('colors');
const _cliProgress = require('cli-progress');
const fs = require('fs');
const cheerio = require('cheerio');
const builder = require('xmlbuilder');

const obj = {
    objects: {
        object: []
    }
};

const XmlSaver = async () => {
    for (let i = 1; i <= 10; i++) {
        const options = {
            uri: `http://vuzopedia.ru/vuz/${i}`,
            transform: (body) => cheerio.load(body)
        };

        try {
            const $ = await rp(options);
            const object = {
                '@code': '',
                '@name_short': '',
                '@name_long': $('.mainTitle').text().replace(/\s+/g,' ').trim(),
                '@geo_x': '',
                '@geo_y': '',
                '@type': '',
                '@description': $('.midVuztext').text().replace(/\s+/g,' ').trim(),
                '@contact': $('.specnoqqwe div').eq(1).text(),
                '@url': $('.specnoqqwe div').eq(3).text(),
                '@work_time': '',
            };

            obj.objects.object.push(object);
        } catch (e) {
            console.log(e);
        }
    }

    const xml = builder.create(obj).end({ pretty: true });
    fs.writeFile('result.xml', xml, () => console.log('XML successfully generated'));
};

const JsonSaver = async () => {
    fs.writeFile('result.json', '[', () => null);
    const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
    const VUZ_END = 1000;
    const VUZ_START = 407;

    bar.start(VUZ_END - VUZ_START + 1, 0);

    for (let i = VUZ_START; i <= VUZ_END; i++) {

        try {
            const req = await rp({
                uri: `http://vuzopedia.ru/vuz/${i}`
            });
            const $ = cheerio.load(req.body);

            const object = {
                id: i,
                city: $('.choosecity span').eq(0).text().trim(),
                name_short: $('.choosevuz span').eq(0).text().replace(/\s+/g,' ').trim(),
                name_long: $('.mainTitle').text().replace(/\s+/g,' ').trim(),
                description: $('.midVuztext').text().replace(/\s+/g,' ').trim(),
                contact: $('.specnoqqwe div').eq(1).text().trim(),
                url: $('.specnoqqwe div').eq(3).text().trim(),
            };

            console.log(`Scrapped`.yellow,  object.name_long.cyan);

            const vuzName = object.name_long.toLowerCase();
            if (vuzName && !vuzName.includes('факультет') &&
                !vuzName.includes('кафедра') &&
                !vuzName.includes('школа') &&
                !vuzName.includes('такой страницы нет')
            ) {
                fs.appendFile('result.json', JSON.stringify(object, null, 4) + ',\n', () =>
                    console.log(`\nSuccessfully appended json`.yellow)
                );
            } else if (!vuzName) {
                fs.appendFile('result_unsuccess.json', JSON.stringify(object, null, 4) + ',\n', () =>
                    console.log(`\nSuccessfully appended to result_unsuccess`.yellow)
                );
            }

            bar.increment();
        } catch (e) {
            console.log(e);
        }
    }

    fs.appendFile('result.json', ']', () => console.log('Finished scrapping'.yellow));
    bar.stop();
};


const TestOne = async () => {
    try {
        const req = await rp({
            uri: `http://vuzopedia.ru/vuz/407`,
            attempts: 3
        });
        console.log(req);
        const $ = cheerio.load(req.body);

        const object = {
            city: $('.choosecity span').eq(0).text().trim(),
            name_short: $('.choosevuz span').eq(0).text().trim(),
            name_long: $('.mainTitle').text().replace(/\s+/g,' ').trim(),
            description: $('.midVuztext').text().replace(/\s+/g,' ').trim(),
            contact: $('.specnoqqwe div').eq(1).text().trim(),
            url: $('.specnoqqwe div').eq(3).text().trim(),
        };

        obj.objects.object.push(object);
    } catch (e) {
        console.log(e);
    }

    console.log(obj.objects.object[0]);
};

// TestOne();
