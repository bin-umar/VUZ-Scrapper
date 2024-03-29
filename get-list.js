const rp = require('requestretry');
const colors = require('colors');
const _cliProgress = require('cli-progress');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const site = 'vuzopedia-ru';
const directory = `results/${site}`;
const filename = `results/${site}/list-uniivers.json`;
// const filename = `${directory}/list-uniivers2.json`;
const filenameMoscow = `${directory}/uniivers-moscow.json`;
const filenamePiter = `${directory}/uniivers-sp.json`;

const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);

const JsonSaver = async () => {
    fs.writeFile(filename, '[', () => null);
    bar.start(9 * 10, 0);

    for (let i = 1; i <= 9; i++) {
        try {
            const req = await rp({
                uri: `http://vuzopedia.ru/region/city/50?page=${i}`
            });
            const $ = cheerio.load(req.body);

            $('.itemVuzTitle').each((_, item) => {
                const object = {
                    name: $(item).text().trim(),
                    url: `http://vuzopedia.ru` + $(item).parent().attr('href')
                };

                if (object.name && !object.name.toLowerCase().includes('филиал')) {
                    const img_url = $(item).prev().attr('src');
                    if (/^https?:\/\//.test(img_url)) {
                        const img_name = `${_ + (i - 1) * 10}.${path.basename(img_url).split('.')[1]}`;
                        object.image = img_name;
                        rp(img_url).pipe(fs.createWriteStream(`${directory}/sp/${img_name}`));
                    }

                    fs.appendFile(filename,
                        JSON.stringify(object, null, 4) + ',\n',
                        () => console.log(object.name.yellow)
                    );
                }

                bar.increment();
            });
        } catch (e) {
            console.log(e);
        }
    }

    fs.appendFile(filename, ']', () => console.log('Finished scrapping'.yellow));
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

// TestOne();
JsonSaver();
// GetFullPropertiesToJson(filenamePiter);

