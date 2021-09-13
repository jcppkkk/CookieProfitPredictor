// noinspection JSUnusedGlobalSymbols

let BestDealHelper = {
    name: "BestDealHelper",

    config: {
        sortbuildings: 1
    },

    isLoaded: false,

    init: function () {
        MOD = this;
        Game.customOptionsMenu.push(MOD.addOptionsMenu);
        MOD.last_cps = 0;
        MOD.last_buildings = [...Game.ObjectsById].map(e => e.id);
        MOD.last_config_sortbuildings = MOD.config.sortbuildings;

        setTimeout(function () {
            setInterval(MOD.logicLoop, 200);
        }, 500);

        MOD.isLoaded = true;
    },

    load: function (str) {
        const config = JSON.parse(str);
        for (const c in config) MOD.config[c] = config[c];
        MOD.sortBuildings();
    },

    save: function () {
        return JSON.stringify(MOD.config);
    },

    register: function () {
        Game.registerMod(this.name, this);
    },

    addOptionsMenu: function () {
        const body = `
        <div class="listing">
            ${MOD.button('sortbuildings', 'Sort Buildings ON (default)', 'Sort Buildings OFF')}
        </div>`;

        CCSE.AppendCollapsibleOptionsMenu(MOD.name, body)
    },

    logicLoop: function () {
        if (
            MOD.last_cps !== Game.unbuffedCps
            || MOD.config.sortbuildings !== MOD.last_config_sortbuildings
            || !document.querySelector('#normalizedCpspb0')
        ) {
            MOD.sortBuildings();
            MOD.last_config_sortbuildings = MOD.config.sortbuildings;
            MOD.last_cps = Game.unbuffedCps;
        }
    },
    boosted: function (me) {
        let boost;
        let other;
        let synergyBoost = 0;
        if (me.name === 'Grandma') {
            for (const i in Game.GrandmaSynergies) {
                if (Game.Has(Game.GrandmaSynergies[i])) {
                    other = Game.Upgrades[Game.GrandmaSynergies[i]].buildingTie;
                    const mult = me.amount * 0.01 * (1 / (other.id - 1));
                    boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + mult);
                    synergyBoost += boost;
                }
            }
        } else if (me.name === 'Portal' && Game.Has('Elder Pact')) {
            other = Game.Objects['Grandma'];
            boost = (me.amount * 0.05 * other.amount) * Game.globalCpsMult;
            synergyBoost += boost;
        }
        return me.storedCps * Game.globalCpsMult + synergyBoost / Math.max(me.amount, 1);
    },

    insertAfter: function (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    },

    sortBuildings: function () {
        let buildings = [...Game.ObjectsById]
        buildings.forEach(e => e.cpsPerCookie = MOD.boosted(e) / e.price)

        if (MOD.config.sortbuildings) {
            buildings.sort(function (a, b) {
                if (a.locked) return 1;
                return (a.cpsPerCookie === b.cpsPerCookie) ? 0 : (a.cpsPerCookie < b.cpsPerCookie ? 1 : -1);
            });

        }
        if (MOD.config.sortbuildings || MOD.last_config_sortbuildings) {
            // also apply on toggle off
            let store = document.querySelector('#products')
            for (let i = 0; i < buildings.length; ++i) {
                store.appendChild(buildings[i].l);
            }
        }

        // Normalization by Mean
        buildings = buildings.filter(o => o.locked === 0)
        const avg = buildings.map(e => e.cpsPerCookie).reduce((a, b) => a + b, 0) / buildings.length;
        buildings.forEach(e => e.cpsPerCookieDelta = e.cpsPerCookie / avg)
        for (const i in buildings) {
            let me = buildings[i];
            let cpspb = document.querySelector("#normalizedCpspb" + me.id)
            if (!cpspb) {
                cpspb = document.createElement("span");
                cpspb.setAttribute("id", "normalizedCpspb" + me.id);
                MOD.insertAfter(cpspb, l('productPrice' + me.id))
            }
            cpspb.textContent = "(💹" + Beautify(me.cpsPerCookieDelta * 100, 1) + "%)"
        }
    },

    button: function (config, texton, textoff) {
        const name = `BestDealHelper${config}button`;
        const callback = `BestDealHelper.buttonCallback('${config}', '${name}', '${texton}', '${textoff}');`
        const value = MOD.config[config];
        return `<a class="${value ? 'option' : 'option off'}" id="${name}" ${Game.clickStr}="${callback}">${value ? texton : textoff}</a>`
    },

    buttonCallback: function (config, button, texton, textoff) {
        const value = !MOD.config[config];
        MOD.config[config] = value;
        l(button).innerHTML = value ? texton : textoff
        l(button).className = value ? 'option' : 'option off'
        PlaySound('snd/tick.mp3');
    },
};

// Bind methods
for (func of Object.getOwnPropertyNames(BestDealHelper).filter(m => typeof BestDealHelper[m] === 'function')) {
    BestDealHelper[func] = BestDealHelper[func].bind(BestDealHelper);
}

// Load mod
if (!BestDealHelper.isLoaded) {
    if (CCSE && CCSE.isLoaded) {
        BestDealHelper.register();
    } else {
        if (!CCSE) var CCSE = {};
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(BestDealHelper.register);
    }
}
