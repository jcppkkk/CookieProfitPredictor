// noinspection JSUnusedGlobalSymbols
let BestDealHelper = {
    name: "BestDealHelper",

    init: function () {
        this.isLoaded = true;
        this.cps = 0;
        MOD = this;
        setTimeout(MOD.delayedInit, 500);
    },

    delayedInit: function () {
        setInterval(MOD.logicLoop, 200);
    },

    register: function () {
        Game.registerMod(this.name, this);
    },

    logicLoop: function () {
        if (MOD.cps !== Game.unbuffedCps) {
            MOD.cps = Game.unbuffedCps;
            MOD.sortObjects();
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
    sortObjects: function () {
        ObjectArr = [...Game.ObjectsById]
        ObjectArr.forEach(e => e.cpsPerCookie = MOD.boosted(e) / e.price)
        ObjectArr.sort(function (a, b) {
            if (a.locked) return 1;
            return (a.cpsPerCookie === b.cpsPerCookie) ? 0 : (a.cpsPerCookie < b.cpsPerCookie ? 1 : -1);
        });
        let store = document.querySelector('#products')
        for (let i = 0; i < ObjectArr.length; ++i) {
            store.appendChild(ObjectArr[i].l);
        }

        // Normalization by Mean
        ObjectArr = ObjectArr.filter(o => o.locked === 0)
        const avg = ObjectArr.map(e => e.cpsPerCookie).reduce((a, b) => a + b, 0) / ObjectArr.length;
        ObjectArr.forEach(e => e.cpsPerCookieDelta = e.cpsPerCookie / avg)
        for (const i in ObjectArr) {
            let me = ObjectArr[i];
            me.l.children[2].children[3].textContent = Beautify(Math.round(me.bulkPrice)) + " (💹" + Beautify(me.cpsPerCookieDelta * 100, 1) + "%)";
        }
        Game.Notify(`Your buildings is sorted!`, ``, [16, 5], 2, 1);
    },
};


if (!BestDealHelper.isLoaded) {
    BestDealHelper.register();
}
