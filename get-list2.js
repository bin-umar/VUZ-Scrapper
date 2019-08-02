const rp = require('requestretry');
const colors = require('colors');
const _cliProgress = require('cli-progress');
const fs = require('fs');
const cheerio = require('cheerio');

const site = 'edunetwork-ru';
const filename = `results/${site}/list-uniivers2.json`;
const filenameMoscow = `results/${site}/uniivers-moscow2.json`;
const filenamePiter = `results/${site}/uniivers-sp.json`;

const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);

const JsonSaver = async () => {
    fs.writeFile(filename, '[', () => null);
    bar.start(6 * 30, 0);

    for (let i = 0; i < 6; i++) {
        try {
            const req = await rp({
                uri: `http://vuz.edunetwork.ru/77/?page=${i}`
            });
            const $ = cheerio.load(req.body);

            $('.unit').each((_, item) => {
                const a = $(item).find('.unit-name a');
                const object = {
                    name: a.text().trim(),
                    url: `http://vuz.edunetwork.ru` + a.attr('href'),
                    ege: $(item).find('.unit-stats .ege').text().trim()
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
    const newList = [];
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

                const img_url = 'http://vuz.edunetwork.ru' + $('.card-image.hide-on-small-only img').attr('src');
                const img_name = `${i}.png`;
                object.image = 'ms/' + img_name;
                rp(img_url).pipe(fs.createWriteStream(`results/edunetwork-ru/ms/${img_name}`));

                newList.push(object);
                fs.appendFile(filetoSave, JSON.stringify(object, null, 4) + ',\n', () =>
                    console.log(`Successfully appended json`.yellow)
                );
            }

            bar.increment();
        } catch (e) {
            console.log(e);
        }
    }

    fs.writeFile(filetoSave, JSON.stringify(newList, null, 4), () => console.log('Finished scrapping'.yellow));
    bar.stop();
};

// JsonSaver();
GetFullPropertiesToJson(filenameMoscow);

