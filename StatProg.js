//=============================================================================
// Stat-based Progression System
// StatProg.js
// Version: 0.20
// Author: Kuoushi
//=============================================================================

var Compat = Compat || {};
Compat.BE = Compat.BE || {};

//=============================================================================
 /*:
 * @plugindesc v0.20 Replace level progression with stat-based progression.
 * @author Kuoushi
 *
 * @param Default HP Growth Max
 * @desc The default maximum amount for Max HP to increase after battle.
 * @default 20
 *
 * @param Default HP Growth Min
 * @desc The default minimum amount for Max HP to increase after battle.
 * @default 5
 *
 * @param Default HP Growth Rate
 * @desc The default chance to increase Max HP after battle. (1-100)
 * @default 25
 *
 * @param Default MP Growth Max
 * @desc The default maximum amount for Max MP to increase after battle.
 * @default 20
 *
 * @param Default MP Growth Min
 * @desc The default minimum amount for Max MP to increase after battle.
 * @default 5
 *
 * @param Default MP Growth Rate
 * @desc The default chance to increase Max MP after battle. (1-100)
 * @default 25
 *
 * @param Default ATK Growth Max
 * @desc The default maximum amount for ATK to increase after battle.
 * @default 20
 *
 * @param Default ATK Growth Min
 * @desc The default minimum amount for ATK to increase after battle.
 * @default 5
 *
 * @param Default ATK Growth Rate
 * @desc The default chance to increase ATK after battle. (1-100)
 * @default 25
 *
 * @param Default DEF Growth Max
 * @desc The default maximum amount for DEF to increase after battle.
 * @default 20
 *
 * @param Default DEF Growth Min
 * @desc The default minimum amount for DEF to increase after battle.
 * @default 5
 *
 * @param Default DEF Growth Rate
 * @desc The default chance to increase DEF after battle. (1-100)
 * @default 25
 *
 * @param Default MAT Growth Max
 * @desc The default maximum amount for MAT to increase after battle.
 * @default 20
 *
 * @param Default MAT Growth Min
 * @desc The default minimum amount for MAT to increase after battle.
 * @default 5
 *
 * @param Default MAT Growth Rate
 * @desc The default chance to increase MAT after battle. (1-100)
 * @default 25
 *
 * @param Default MDF Growth Max
 * @desc The default maximum amount for MDF to increase after battle.
 * @default 20
 *
 * @param Default MDF Growth Min
 * @desc The default minimum amount for MDF to increase after battle.
 * @default 5
 *
 * @param Default MDF Growth Rate
 * @desc The default chance to increase MDF after battle. (1-100)
 * @default 25
 *
 * @param Default AGI Growth Max
 * @desc The default maximum amount for AGI to increase after battle.
 * @default 20
 *
 * @param Default AGI Growth Min
 * @desc The default minimum amount for AGI to increase after battle.
 * @default 5
 *
 * @param Default AGI Growth Rate
 * @desc The default chance to increase AGI after battle. (1-100)
 * @default 25
 *
 * @param Default LUK Growth Max
 * @desc The default maximum amount for LUK to increase after battle.
 * @default 20
 *
 * @param Default LUK Growth Min
 * @desc The default minimum amount for LUK to increase after battle.
 * @default 5
 *
 * @param Default LUK Growth Rate
 * @desc The default chance to increase LUK after battle. (1-100)
 * @default 25
 *
 * @param Base Skill Growth Rate
 * @desc The default amount added to a character's base growth rate per skill use. (0-100)
 * @default 0
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


(function() {

//=============================================================================
// Parameter Variables
//=============================================================================

    Compat.Parameters = PluginManager.parameters('StatProg');
    Compat.Param = Compat.Param || {};
    Compat.gparam = Compat.gparam || {};
    Compat.skillparam = [];
    Compat.gparamPlus = []; //Compat.gparamPlus || {};
    Compat.aparam = Compat.aparam || {};
    var stats      = [ "Max HP", "Max MP", "ATK", "DEF", "MAT", "MDF", "AGI", "LUK" ];
    var statsShort = [ "hp", "mp", "atk", "def", "mat", "mdf", "agi", "luk" ];

    //Compat.Param. = String(Compat.Parameters['']);
    Compat.Param.Growth = Compat.Param.Growth || {};

    Compat.Param.Growth['hpgmax']  = Number(Compat.Parameters['Default HP Growth Max']);
    Compat.Param.Growth['hpgmin']  = Number(Compat.Parameters['Default HP Growth Min']);
    Compat.Param.Growth['hpgr']    = Number(Compat.Parameters['Default HP Growth Rate']) / 100;
    Compat.Param.Growth['mpgmax']  = Number(Compat.Parameters['Default MP Growth Max']);
    Compat.Param.Growth['mpgmin']  = Number(Compat.Parameters['Default MP Growth Min']);
    Compat.Param.Growth['mpgr']    = Number(Compat.Parameters['Default MP Growth Rate']) / 100;
    Compat.Param.Growth['atkgmax'] = Number(Compat.Parameters['Default ATK Growth Max']);
    Compat.Param.Growth['atkgmin'] = Number(Compat.Parameters['Default ATK Growth Min']);
    Compat.Param.Growth['atkgr']   = Number(Compat.Parameters['Default ATK Growth Rate']) / 100;
    Compat.Param.Growth['defgmax'] = Number(Compat.Parameters['Default DEF Growth Max']);
    Compat.Param.Growth['defgmin'] = Number(Compat.Parameters['Default DEF Growth Min']);
    Compat.Param.Growth['defgr']   = Number(Compat.Parameters['Default DEF Growth Rate']) / 100;
    Compat.Param.Growth['matgmax'] = Number(Compat.Parameters['Default MAT Growth Max']);
    Compat.Param.Growth['matgmin'] = Number(Compat.Parameters['Default MAT Growth Min']);
    Compat.Param.Growth['matgr']   = Number(Compat.Parameters['Default MAT Growth Rate']) / 100;
    Compat.Param.Growth['mdfgmax'] = Number(Compat.Parameters['Default MDF Growth Max']);
    Compat.Param.Growth['mdfgmin'] = Number(Compat.Parameters['Default MDF Growth Min']);
    Compat.Param.Growth['mdfgr']   = Number(Compat.Parameters['Default MDF Growth Rate']) / 100;
    Compat.Param.Growth['agigmax'] = Number(Compat.Parameters['Default AGI Growth Max']);
    Compat.Param.Growth['agigmin'] = Number(Compat.Parameters['Default AGI Growth Min']);
    Compat.Param.Growth['agigr']   = Number(Compat.Parameters['Default AGI Growth Rate']) / 100;
    Compat.Param.Growth['lukgmax'] = Number(Compat.Parameters['Default LUK Growth Max']);
    Compat.Param.Growth['lukgmin'] = Number(Compat.Parameters['Default LUK Growth Min']);
    Compat.Param.Growth['lukgr']   = Number(Compat.Parameters['Default LUK Growth Rate']) / 100;
    Compat.Param.SkillGrowthRate   = Number(Compat.Parameters['Base Skill Growth Rate']);

//=============================================================================
// DataManager
//=============================================================================

    var extractMetadata = DataManager.extractMetadata;
    DataManager.extractMetadata = function(data) {
        extractMetadata.apply(this, arguments);
        if(data.classId) {
            Compat.gparam[data.id] = Compat.gparam[data.id] || {};
            Compat.gparam[data.id] = MVC.deepClone(Compat.Param.Growth);
            Compat.gparamPlus[data.id] = [ 0,0,0,0,0,0,0,0 ];

            for(var a in data.meta) {  // only actors
                var b = parseInt(data.meta[a]);
                if(a.toUpperCase().indexOf("GR") > -1) {
                    b /= 100;
                }
                Compat.gparam[data.id][a] = b;
            }
        }
        else if ((data.speed || data.speed == 0) && (data.message1 || data.message1 == "")) { // only skills
            Compat.skillparam[data.id] = [];
            
            for(var k = 0; k < stats.length; k++) {
                Compat.skillparam[data.id][k] = Compat.Param.SkillGrowthRate;
            }
            if(data.meta["GrowStats"]) {
                var x = data.meta["GrowStats"].split(",");
                for(var i = 0; i < x.length; i++) {
                    Compat.skillparam[data.id][i] = parseInt(x[i]);
                }
            }
        }
    };

//=============================================================================
// BattlerBase
//=============================================================================

    //growth and min/max stats for HP
    MVC.reader(Game_BattlerBase.prototype,'hpgr', function(){
        return this._hpGrowthRate();
    });
    MVC.reader(Game_BattlerBase.prototype,'hpgmin', function(){
        return Compat.gparam[this._actorId]["hpgmin"];
    });
    MVC.reader(Game_BattlerBase.prototype,'hpgmax', function(){
        return Compat.gparam[this._actorId]["hpgmax"];
    });

    Game_BattlerBase.prototype._hpGrowthRate = function() {
        return Compat.gparam[this._actorId]["hpgr"] + Compat.gparamPlus[this._actorId][0];
    }

    //growth and min/max stats for MP
    MVC.reader(Game_BattlerBase.prototype,'mpgr', function(){
        return this._mpGrowthRate();
    });
    MVC.reader(Game_BattlerBase.prototype,'mpgmin', function(){
        return Compat.gparam[this._actorId]["mpgmin"];
    });
    MVC.reader(Game_BattlerBase.prototype,'mpgmax', function(){
        return Compat.gparam[this._actorId]["mpgmax"];
    });

    Game_BattlerBase.prototype._mpGrowthRate = function() {
        return Compat.gparam[this._actorId]["mpgr"] + Compat.gparamPlus[this._actorId][1];
    }

    //growth and min/max stats for ATK
    MVC.reader(Game_BattlerBase.prototype,'atkgr', function(){
        return this._atkGrowthRate();
    });
    MVC.reader(Game_BattlerBase.prototype,'atkgmin', function(){
        return Compat.gparam[this._actorId]["atkgmin"];
    });
    MVC.reader(Game_BattlerBase.prototype,'atkgmax', function(){
        return Compat.gparam[this._actorId]["atkgmax"];
    });

    Game_BattlerBase.prototype._atkGrowthRate = function() {
        return Compat.gparam[this._actorId]["atkgr"] + Compat.gparamPlus[this._actorId][2];
    }

    //growth and min/max stats for DEF
    MVC.reader(Game_BattlerBase.prototype,'defgr', function(){
        return this._defGrowthRate();
    });
    MVC.reader(Game_BattlerBase.prototype,'defgmin', function(){
        return Compat.gparam[this._actorId]["defgmin"];
    });
    MVC.reader(Game_BattlerBase.prototype,'defgmax', function(){
        return Compat.gparam[this._actorId]["defgmax"];
    });

    Game_BattlerBase.prototype._defGrowthRate = function() {
        return Compat.gparam[this._actorId]["defgr"] + Compat.gparamPlus[this._actorId][3];
    }

    //growth and min/max stats for MAT
    MVC.reader(Game_BattlerBase.prototype,'matgr', function(){
        return this._matGrowthRate();
    });
    MVC.reader(Game_BattlerBase.prototype,'matgmin', function(){
        return Compat.gparam[this._actorId]["matgmin"];
    });
    MVC.reader(Game_BattlerBase.prototype,'matgmax', function(){
        return Compat.gparam[this._actorId]["matgmax"];
    });

    Game_BattlerBase.prototype._matGrowthRate = function() {
        return Compat.gparam[this._actorId]["matgr"] + Compat.gparamPlus[this._actorId][4];
    }

    //growth and min/max stats for MDF
    MVC.reader(Game_BattlerBase.prototype,'mdfgr', function(){
        return this._mdfGrowthRate();
    });
    MVC.reader(Game_BattlerBase.prototype,'mdfgmin', function(){
        return Compat.gparam[this._actorId]["mdfgmin"];
    });
    MVC.reader(Game_BattlerBase.prototype,'mdfgmax', function(){
        return Compat.gparam[this._actorId]["mdfgmax"];
    });

    Game_BattlerBase.prototype._mdfGrowthRate = function() {
        return Compat.gparam[this._actorId]["mdfgr"] + Compat.gparamPlus[this._actorId][5];
    }

    //growth and min/max stats for AGI
    MVC.reader(Game_BattlerBase.prototype,'agigr', function(){
        return this._agiGrowthRate();
    });
    MVC.reader(Game_BattlerBase.prototype,'agigmin', function(){
        return Compat.gparam[this._actorId]["agigmin"];
    });
    MVC.reader(Game_BattlerBase.prototype,'agigmax', function(){
        return Compat.gparam[this._actorId]["agigmax"];
    });

    Game_BattlerBase.prototype._agiGrowthRate = function() {
        return Compat.gparam[this._actorId]["agigr"] + Compat.gparamPlus[this._actorId][6];
    }

    //growth and min/max stats for LUK
    MVC.reader(Game_BattlerBase.prototype,'lukgr', function(){
        return this._lukGrowthRate();
    });
    MVC.reader(Game_BattlerBase.prototype,'lukgmin', function(){
        return Compat.gparam[this._actorId]["lukgmin"];
    });
    MVC.reader(Game_BattlerBase.prototype,'lukgmax', function(){
        return Compat.gparam[this._actorId]["lukgmax"];
    });

    Game_BattlerBase.prototype._lukGrowthRate = function() {
        return Compat.gparam[this._actorId]["lukgr"] + Compat.gparamPlus[this._actorId][7];
    }
    
    Game_BattlerBase.prototype.getRates = function(paramId) {
        var growth = [];
        if(paramId >= 0 && paramId < 8) {
            var statKey = String(statsShort[paramId])
            var key = statKey + "gr";
            growth[0] = Compat.gparam[this._actorId][key] + Compat.gparamPlus[this._actorId][paramId];
            var key = statKey + "gmax";
            growth[1] = Compat.gparam[this._actorId][key];
            var key = statKey + "gmin";
            growth[2] = Compat.gparam[this._actorId][key];
        }
        return growth;
    }
    
    Game_BattlerBase.prototype.clearGParamPlus = function() {
        Compat.gparamPlus[this._actorId] = [ 0,0,0,0,0,0,0,0 ];
    }

//=============================================================================
// BattleManager
//=============================================================================

    Compat.BE.BattleManager_makeRewards = BattleManager.makeRewards;
    BattleManager.makeRewards = function() {
        Compat.BE.BattleManager_makeRewards.call(this);
        Compat.aparam = undefined;
        Compat.aparam = Compat.aparam || {};
        $gameParty.battleMembers().forEach(function(actor) {
            Compat.aparam[actor._actorId] = []; //Compat.aparam[actor._actorId] || {};

            for(var i = 0; i < 8; i++) {
                var growthRates = actor.getRates(i);
                if(growthRates[0] > Math.random()) {
                    var inc = Math.floor(Math.random() * (growthRates[1] - growthRates[2] + 1) + growthRates[2]);
                    Compat.aparam[actor._actorId][i] = inc;
                }
            }

        }, this);
    };

    Compat.BE.BattleManager_gainRewards = BattleManager.gainRewards;
    BattleManager.gainRewards = function() {
        Compat.BE.BattleManager_gainRewards.call(this);
        $gameParty.battleMembers().forEach(function(actor) {
            if(Compat.aparam[actor._actorId]) {
                for(var a in Compat.aparam[actor._actorId]) {
                    actor.addParam(a,Compat.aparam[actor._actorId][a]);
                }
            }
            actor.clearGParamPlus();
        }, this);
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

            for(var i = 0; i < stats.length; i++) {
                Compat.gparamPlus[subject._actorId][i] += (Compat.skillparam[attackSkill][i] / 100);
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
            for(var i = 0; i < 8; i++) {
                if(Compat.aparam[actor._actorId][i]) {
                    var temp = actor.param(i) - Compat.aparam[actor._actorId][i];
                    var str = stats[i] + ": ";
                    if(i > 1) {
                        str = str + "   ";
                    }
                    str = str + temp + " -> " + actor.param(i);
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

    }
})();