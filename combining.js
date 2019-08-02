const fs = require('fs');
const rp = require('requestretry');

const GeoLocation = async () => {
    const file = fs.readFileSync('results/vuzopedia-ru/uniivers-moscow.json');
    const list = Array.from(JSON.parse(file));

    for (let i=0; i < list.length; i++) {
        const un = list[i];
        const req = await rp({
            uri: encodeURI(`https://geocode-maps.yandex.ru/1.x/?apikey=f1713d93-9684-4d6c-9f32-0ed3af9b776d&format=json&geocode=${un.contact}`)
        });

        if (JSON.parse(req.body).response && JSON.parse(req.body).response.GeoObjectCollection.featureMember[0]) {
            console.log(un.contact, JSON.parse(req.body).response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos);
            un.geo = JSON.parse(req.body).response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
        }
    }

    fs.writeFile('results/vuzopedia-ru/uniivers-moscow2.json', JSON.stringify(list,null, 4), () => null);
};

GeoLocation();

const Combine = () => {
    const file1 = fs.readFileSync('results/vuzopedia-ru/uniivers-moscow.json');
    const file2 = fs.readFileSync('results/edunetwork-ru/uniivers-moscow.json');
    const shortList1 = Array.from(JSON.parse(file1));
    const fullList1 = Array.from(JSON.parse(file2));

    const common = [];
    const differ = [];

    fullList1.forEach(un => {
        const short = shortList1.find(el => el.name_long === un.name_long);
        un.image = 'edunetwork-ru/' + un.image;
        short ? common.push(Object.assign(short, un)) : differ.push(un);
    });

    shortList1.forEach(un => {
        const short = fullList1.find(el => el.name_long === un.name_long);
        const inCommon = common.find(el => el.name_long === un.name_long);
        const inDiffer = differ.find(el => el.name_long === un.name_long);
        if (short && !inCommon) {
            un.image = 'vuzopedia-ru/' + un.image;
            common.push(Object.assign(un, short));
        } else if (!short && !inDiffer) {
            un.image = 'vuzopedia-ru/' + un.image;
            differ.push(un);
        }
    });

    console.log('common', common.length);
    console.log('differ', differ.length);
    console.log(fullList1.length, shortList1.length);
    fs.writeFile('results/common.json', JSON.stringify(common,null, 4), () => null);
    fs.writeFile('results/differ.json', JSON.stringify(differ,null, 4), () => null);
    common.push(...differ);
    fs.writeFile('results/final-ms.json', JSON.stringify(common,null, 4), () => null);
};

const AverageEge = () => {
    const file1 = fs.readFileSync('results/edunetwork-ru/list-uniivers.json');
    const file2 = fs.readFileSync('results/edunetwork-ru/uniivers-sp.json');
    const shortList1 = Array.from(JSON.parse(file1));
    const fullList1 = Array.from(JSON.parse(file2));

    fullList1.forEach(un => {
        const short = shortList1.find(el => el.url === un.url);
        un.average_ege = short.ege.replace('Средний ЕГЭ: ', '');
    });

    fs.writeFile('results/edunetwork-ru/uniivers-sp.json', JSON.stringify(fullList1,null, 4), () => null);
};


