//=============================================================================
// Stat-based Progression System
// StatProg.js
// Version: 0.31
// Author: Kuoushi
//=============================================================================

var Compat = Compat || {};
Compat.BE = Compat.BE || {};

//=============================================================================
 /*:
 * @plugindesc v0.31 Replace level progression with stat-based progression.
 * @author Kuoushi
 *
 * @param Base Skill Growth Rate
 * @desc The default amount added to a character's base growth rate per skill use. (0-100)
 * @default 0
 *
 * @param Base Weapon Growth Rate
 * @desc The default amount added to a character's base growth rate per weapon use. (0-100)
 * @default 0
 *
 * @param Default Growth Max
 * @desc The default maximum amount for params to increase after battle.
 * @default 20
 *
 * @param Default Growth Min
 * @desc The default minimum amount for params to increase after battle.
 * @default 5
 *
 * @param Default Growth Rate
 * @desc The default chance to increase params after battle. (1-100)
 * @default 25
 *
 * @param Custom Stats
 * @desc Comma-separated list of custom stats to add growth to. (ex. str,dex)
 *
 * @default -1
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin replaces the current leveling system with a stat-based
 * progression system where characters gain stats based on what actions they
 * use in battle, rather than based on levels and experience.
 *
 * This plugin requires MVCommons.js to work and as far as I'm aware does not
 * break or clash with most plugins. Tested with all of Yanfly active.
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * 0.31  Added simple after battle stats gained message.
 * 0.30  Fixed up some dirty code, added in some more dirty code, but overall
 *       a net gain for usability's sake. This version now fully supports my
 *       CustomStats plugin. Other plugins that add stats MIGHT also work with
 *       this depending on how the stats themselves are implemented.
 * 0.27  Made the weapon and skill notetags a little bit more flexible so now
 *       if you want to only modify a single parameter instead and keep the 
 *       the rest default you can simply say <GrowStat_ATK: 25> to increase the
 *       character's chance of gaining points in the ATK parameter by 25% at
 *       the end of battle. Also fixed up some case issues with other notetags.
 * 0.26  Found a horrible bug and smashed it. Growth rates now return proper
 *       values once again.
 * 0.25  Weapons are now also able to increase the chance of gaining a stat
 *       in the same way that skills do. Just add:
 *       <GrowStats: 1,2,3,4,5,6,7,8>
 *       to the notetags with whatever values you'd like, or set the default
 *       for all weapons in the plugin parameters.
 * 0.20  Skills can now give an increased chance of gaining specific stats
 *       when they are used in battle. New default parameter added to let 
 *       users set the base increase for all skills (0 for none, 100 for 
 *       certain skill increase.) Skill notetags are required at the moment
 *       for each skill unless you want them all to have the base gain chance.
 *       <GrowStats: 1,2,3,4,5,6,7,8> is the current format. All numbers are
 *       currently required in order for this to work, and each number can be
 *       from 0 to 100. They correspond to the basic stats (Max HP, Max MP, ATK,
 *       DEF, MAT, MDF, AGI, LUK).
 *
 * 0.151 Some code cleanup. Only some though.
 *
 * 0.15  Added extremely early support of YEP_VictoryAftermath. Presently it
 *       will just replace the current EXP screen until I can figure out how
 *       to make it do a custom screen. It's also ugly.
 *
 * 0.10  Released extremely early alpha. Stats will raise based on parameter
 *       values that can be set through plugin parameters or in the actor's
 *       notetags. Presently the gains are not based on any specific skill
 *       usage but on a random chance as defined through plugin parameters.
 *       The leveling system is also still in place with references to it in
 *       windows and everything. This can currently be counteracted by setting
 *       enemy experience gains to 0.
 */
//=============================================================================

//=============================================================================
// Game_GrowthRates - Contains all of our growth stats
//=============================================================================
/*
function Game_GrowthRates() {
    this.initialize.apply(this, arguments);
}

Game_GrowthRates.prototype.initialize = function() {
    this.initRates();
};

Game_GrowthRates.prototype.initRates = function() {

}
*/

//=============================================================================
// Game_ActorGrowth - Contains rates for a single actor
//=============================================================================
function Game_ActorGrowth() {
    this.initialize.apply(this, arguments);
}

Game_ActorGrowth.prototype.initialize = function() {
    this.initGrowth();
};

Game_ActorGrowth.prototype.initGrowth = function() {
    this._actorId     = -1;
    this._growthRate  = [];
    this._addGrowth   = [];
    this._growthMin   = [];
    this._growthMax   = [];
    this._battleGains = [];
};

Game_ActorGrowth.prototype.setActor = function(id) {
    this._actorId = id;
};

Game_ActorGrowth.prototype.getActor = function() {
    return this._actorId;
};

Game_ActorGrowth.prototype.setParam = function(key,rates) {
    this._growthRate[key] = rates['rate'];
    this._addGrowth[key]  = 0;
    this._growthMax[key]  = rates['max'];
    this._growthMin[key]  = rates['min'];
};

Game_ActorGrowth.prototype.setRate = function(key,rate) {
    this._growthRate[key] = rate;
    this._addGrowth[key]  = 0;
};

Game_ActorGrowth.prototype.setMin = function(key,tMin) {
    this._growthMin[key] = tMin;
};

Game_ActorGrowth.prototype.setMax = function(key,tMax) {
    this._growthMax[key] = tMax;
};

Game_ActorGrowth.prototype.getParam = function(key) {
    var r = [];
    r['rate'] = this._growthRate[key] + this._addGrowth[key];
    r['max']  = this._growthMax[key];
    r['min']  = this._growthMin[key];
    return r;
};

Game_ActorGrowth.prototype.getRate = function(key) {
    return this._growthRate[key] + this._addGrowth[key];
};

Game_ActorGrowth.prototype.getMax = function(key) {
    return this._growthMax[key];
};

Game_ActorGrowth.prototype.getMin = function(key) {
    return this._growthMin[key];
};

Game_ActorGrowth.prototype.addRate = function(key,val) {
    this._addGrowth[key] += val;
    if(this._addGrowth[key] > 1) {
      this._addGrowth[key] = 1;
    }
};

Game_ActorGrowth.prototype.clearBattleGrowth = function() {
    for(var a in this._addGrowth) {
        this._addGrowth[a] = 0;
    }
};

Game_ActorGrowth.prototype.addBattleGains = function(key,val) {
    this._battleGains[key] = val;
};

Game_ActorGrowth.prototype.getBattleGains = function(key) {
    return this._battleGains[key];
};

Game_ActorGrowth.prototype.getAllBattleGains = function() {
    return this._battleGains;
};

Game_ActorGrowth.prototype.clearBattleGains = function() {
    this._battleGains = [];
};

//=============================================================================
// Game_ItemGrowth - Contains rates for a single item (weapon or skill)
//=============================================================================
function Game_ItemGrowth() {
    this.initialize.apply(this, arguments);
}

Game_ItemGrowth.prototype.initialize = function() {
    this.initGrowth();
};

Game_ItemGrowth.prototype.initGrowth = function() {
    this._itemId     = -1;
    this._growthRate = [];
};

Game_ItemGrowth.prototype.setItem = function(id) {
    this._itemId = id;
};

Game_ItemGrowth.prototype.getItem = function() {
    return this._itemId;
};

Game_ItemGrowth.prototype.setRate = function(key,rate) {
    this._growthRate[key] = rate;
};

Game_ItemGrowth.prototype.getRate = function(key) {
    return this._growthRate[key];
};

(function() {

//=============================================================================
// Parameter Variables
//=============================================================================

    Compat.Parameters = PluginManager.parameters('StatProg');
    Compat.Param = Compat.Param || {};
    var stats      = [ "Max HP", "Max MP", "ATK", "DEF", "MAT", "MDF", "AGI", "LUK" ];
    var statsShort = [ "hp", "mp", "atk", "def", "mat", "mdf", "agi", "luk" ];

    // growth object arrays
    Compat.actors  = [];
    Compat.weapons = [];
    Compat.skills  = [];

    //Compat.Param. = String(Compat.Parameters['']);
    Compat.Param.Growth = Compat.Param.Growth || {};

    Compat.Param.Default          = [];
    Compat.Param.Default['rate']  = Number(Compat.Parameters["Default Growth Rate"]) / 100;
    Compat.Param.Default['max']   = Number(Compat.Parameters["Default Growth Max"]);
    Compat.Param.Default['min']   = Number(Compat.Parameters["Default Growth Min"]);
    Compat.Param.SkillGrowthRate  = Number(Compat.Parameters["Base Skill Growth Rate"]);
    Compat.Param.WeaponGrowthRate = Number(Compat.Parameters["Base Weapon Growth Rate"]);

    Compat.Param.custom           = String(Compat.Parameters['Custom Stats']).trim();
    if(Compat.Param.custom != "-1") {
        var tempstats = Compat.Param.custom.split(",");
        tempstats.forEach(function(stat) {
            stats.push(stat.toUpperCase());
            statsShort.push(stat.toLowerCase());
        });
    }

//=============================================================================
// DataManager
//=============================================================================

    var extractMetadata = DataManager.extractMetadata;
    DataManager.extractMetadata = function(data) {
        extractMetadata.apply(this, arguments);
        if(data.classId) {
            var actorRates = new Game_ActorGrowth();
            actorRates.setActor(data.id);
            statsShort.forEach(function(stat) {
                actorRates.setParam(stat,Compat.Param.Default);
            });

            for(var a in data.meta) {  // only actors
                var b = parseInt(data.meta[a]);
                if(a.toLowerCase().substr(-2) == "gr") {
                    b /= 100;
                    var key = a.toLowerCase().substr(0,a.length - 2);
                    actorRates.setRate(key, b);
                }
                else if(a.toLowerCase().substr(-4) == "gmax") {
                    var key = a.toLowerCase().substr(0,a.length-4);
                    actorRates.setMax(key,b);
                }
                else if(a.toLowerCase().substr(-4) == "gmin") {
                    var key = a.toLowerCase().substr(0,a.length-4);
                    actorRates.setMin(key,b);
                }
            }
            Compat.actors[data.id] = actorRates;
        }
        else {
            var skill  = (data.speed || data.speed == 0) && (data.message1 || data.message1 == "");
            var weapon = (data.wtypeId || data.wtypeId == 0);
            if(skill || weapon) {
                var rates = new Game_ItemGrowth();
                rates.setItem(data.id);
                statsShort.forEach(function(stat) {
                    rates.setRate(stat,Compat.Param.SkillGrowthRate);
                    if(weapon)
                        rates.setRate(stat,Compat.Param.WeaponGrowthRate);
                });

                for(var a in data.meta) {
                    if(a.toLowerCase() == "growstats") {
                        var x = data.meta[a].split(",");
                        for(var i = 0; i < x.length; i++) {
                            rates.setRate(statsShort[i],parseInt(x[i]));
                        }
                    }
                    else if(a.toLowerCase().indexOf("growstat_") > -1) {
                        var key = a.substr(9).toLowerCase();
                        rates.setRate(key, parseInt(data.meta[a]));
                    }
                }
                if(weapon)
                    Compat.weapons[data.id] = rates;
                else
                    Compat.skills[data.id] = rates;
            }
        }
    };


//=============================================================================
// BattleManager
//=============================================================================

    Compat.BE.BattleManager_makeRewards = BattleManager.makeRewards;
    BattleManager.makeRewards = function() {
        Compat.BE.BattleManager_makeRewards.call(this);

        $gameParty.battleMembers().forEach(function(actor) {
            for(var i = 0; i < statsShort.length; i++) {
                var growthRates = Compat.actors[actor._actorId].getParam(statsShort[i]);

                if(growthRates['rate'] > Math.random()) {
                    var inc = Math.floor(Math.random() * (growthRates['max'] - growthRates['min'] + 1) + growthRates['min']);
                    Compat.actors[actor._actorId].addBattleGains(statsShort[i],inc);
                }
            }
        }, this);
    };

    Compat.BE.BattleManager_gainRewards = BattleManager.gainRewards;
    BattleManager.gainRewards = function() {
        Compat.BE.BattleManager_gainRewards.call(this);
        $gameParty.battleMembers().forEach(function(actor) {
            gains = Compat.actors[actor._actorId].getAllBattleGains();
            for(var a in gains) {
              var key = statsShort.indexOf(a);

              if(key > 7) {
                  key = a;
              }

              if(typeof(key) == "string" || key > -1) {
                  actor.addParam(key,gains[a]);
              }
            }
        }, this);
    };

    Compat.BE.BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        $gameParty.battleMembers().forEach(function(actor) {
            Compat.actors[actor._actorId].clearBattleGrowth();
            Compat.actors[actor._actorId].clearBattleGains();
        });
        Compat.BE.BattleManager_endBattle.call(this,result);
    };


//=============================================================================
// Game_Action
//=============================================================================

    Compat.BE.Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        Compat.BE.Game_Action_apply.call(this, target);
        var subject = this.subject();
        if(subject._classId >= 0) {
            var attackSkill = this._item.itemId();
            var weaponId    = -1;
            if(!subject.hasNoWeapons() && this._item.isSkill() && attackSkill == subject.attackSkillId()) {
                var weapons = subject.weapons();
                for(var a in subject.weapons()) {
                    if(subject.weapons()[a].baseItemId)
                        weaponId = subject.weapons()[a].baseItemId;
                }
            }

            for(var i = 0; i < stats.length; i++) {
                Compat.actors[subject._actorId].addRate(statsShort[i],Compat.skills[attackSkill].getRate(statsShort[i]) / 100);
                if(weaponId > -1) {
                    Compat.actors[subject._actorId].addRate(statsShort[i],(Compat.weapons[weaponId].getRate(statsShort[i]) / 100));
                }
            }
        }
    };

//=============================================================================
// Victory Windows
//=============================================================================

    if(Imported.YEP_VictoryAftermath) {

        Window_VictoryExp.prototype.drawActorGauge = function(actor, index) {
            var rect = this.gaugeRect(index);
            this.changeTextColor(this.normalColor());
            this.drawActorName(actor, rect.x + 2, rect.y);
            this.drawStats(actor, rect);
        };

        Window_VictoryExp.prototype.drawStats = function(actor, rect) {
            var yOffset = 0;
            var xOffset = 128;
            for(var i = 0; i < statsShort.length; i++) {
                var gains = Compat.actors[actor._actorId].getBattleGains(statsShort[i]);
                if(gains && gains > 0) {
                    var temp = 0;

                    if(i < 8)
                        temp = actor.param(i) - gains;
                    else
                        temp = actor.param(statsShort[i]) - gains;

                    if(temp < 0) temp = 0;

                    var str = stats[i] + ": ";
                    if(i > 1) {
                        str = str + "   ";
                    }
                    str = str + temp + " -> ";

                    if(i < 8)
                        str = str + actor.param(i);
                    else
                        str = str + actor.param(statsShort[i]);

                    this.drawText(str, rect.x + xOffset, rect.y + yOffset, rect.width - 4, 'left');
                    yOffset += 36;
                }

                if(yOffset == 144) {
                    yOffset = 0;
                    xOffset += 300;
                }
            }
        };
    }
    else {
        Compat.BE.BattleManager_displayVictoryMessage = BattleManager.displayVictoryMessage;
        BattleManager.displayVictoryMessage = function() {
            Compat.BE.BattleManager_displayVictoryMessage.call(this);
            $gameParty.battleMembers().forEach(function(actor) {
                var gains = Compat.actors[actor._actorId].getAllBattleGains();
                for(var g in gains) {
                    if(gains[g] > 0)
                        $gameMessage.add(actor.name() + " gains " + gains[g] + " " + g.toUpperCase() + "!");
                }
            });
        };
    }
})();