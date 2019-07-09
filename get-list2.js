const rp = require('requestretry');
const colors = require('colors');
const _cliProgress = require('cli-progress');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const builder = require('xmlbuilder');

const site = 'edunetwork-ru';
const filename = `results/${site}/list-uniivers2.json`;
const filenameMoscow = `results/${site}/uniivers-moscow.json`;
const filenamePiter = `results/${site}/uniivers-sp.json`;

const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);

const JsonSaver = async () => {
    fs.writeFile(filename, '[', () => null);
    bar.start(3 * 30, 0);

    for (let i = 0; i < 3; i++) {
        try {
            const req = await rp({
                uri: `http://vuz.edunetwork.ru/77/?page=${i}`
            });
            const $ = cheerio.load(req.body);

            $('.unit-name a').each((_, item) => {
                const object = {
                    name: $(item).text().trim(),
                    url: `http://vuz.edunetwork.ru` + $(item).attr('href')
                };

                if (object.name && !object.name.toLowerCase().includes('филиал')) {
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
                    selection_committee: {
                        address: $('.addr .valign-wrapper').eq(0).text().replace('place', '').trim(),
                        phone: $('.tels p a').text().trim(),
                        site: $('.web .valign-wrapper a').attr('href'),
                        email: $('.web .valign-wrapper').eq(1).text().replace('mail_outline', ''),
                        work_time: $('.schedule p:not(:first-child)').text()
                    },
                    name_short: $('#unit-nav > ul > li:first-child').text().trim(),
                    name_long: list[i].name,
                    description: $('#about p:nth-child(2)').text().trim(),
                    contact: $('.info .valign-wrapper:first-child').text().replace('place', '').trim(),
                    phone: $('.tels > a').text().trim(),
                    site: $('.info .valign-wrapper a').attr('href'),
                    url: list[i].url
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
// JsonSaver();
GetFullPropertiesToJson(filenameMoscow);

