//=============================================================================
// Skill Chance
// SkillChance.js
// Version: 0.11
// Author: Kuoushi
//=============================================================================

var Compat = Compat || {};
Compat.BE = Compat.BE || {};

//=============================================================================
 /*:
 * @plugindesc v0.11 Allows characters to learn skills in battle by using other
 *                   weapons or skills.
 * @author Kuoushi
 *
 * @param Default Chance
 * @desc Default chance for a skill to proc if not specified.
 * @default 25
 * 
 * @param Consume On Learn
 * @desc Toggles whether or not HP/MP/TP will be consumed when a new skill is
 *       learned. (0 = OFF, 1 = ON)
 * @default 0
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin allows characters to learn skills based on actions taken in
 * battle. If a character "learns" a skill in battle, they use it immediately
 * instead of the skill the player chose to use. For instance, say you want to
 * do a basic attack with a character. Before that basic attack is executed
 * there is a chance that the character will spark a new skill, meaning that
 * instead of the random attack the character will use the new skill and have
 * it be available permanently from then on.
 *
 * Notetags are required in order to use this plugin. Each weapon or skill will
 * need a <LearnChance: skillid,skillid2,...> notetag where skillid is the ID of the
 * skill you wish to be learnable and chance to learn is determined in the <LearnRate:
 * skillrate1,skillrate2,...> tag, where skillrate is the percent (0-100) chance of
 * learning that skill with every use. For example, if you wish to give a sword
 * a 5% chance to learn double slash every time a regular attack is used, you'd
 * go to the sword's item entry in the weapons tab in your database and add the
 * notetag:
 *
 * <LearnChance: 4>
 * <LearnRate: 5>
 *
 * That is, of course, assuming you have a skill named double slash in spot 4
 * in your skills tab. You can also use the default learn chance specified in
 * the parameters by simply dropping the rate notetag like so:
 *
 * <LearnChance: 4>
 *
 * The default attack skill will use weapon notetags only, while all other
 * skills will use the skill notetags.
 *
 * For more advanced learning branches of sorts, you'll need to add more skills
 * to each weapon or skill notetag. For instance, say you want to have a sword
 * that has a chance to learn 5 different skills with differing rates, you'd
 * need to set up your notetags like follows:
 *
 * <LearnChance: 4,6,9,12,41>
 * <LearnRate: 5,3,,2,0.1>
 *
 * Note how every skill is represented in both notetags. In this instance, skill
 * 9 has a "blank" spot. This indicates to the script that you want to use the
 * default rate defined in the plugin settings. You can also put a " " space, or
 * a -1 to signify the same thing. Another thing to note is that for learning 
 * skill 41, I put a 0.1. This means 0.1%. You can go as far down as you want
 * in general.
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * 0.12   Fixed bug with the script not supporting learning multiple skills
 *        from a single weapon or skill. Notetags are updated accordingly and
 *        it should work fine now.
 * 0.11   Added Consume on Learn plugin parameter which allows you to set
 *        whether or not a skill will use HP/MP/TP the moment it is learned and
 *        first used in battle.
 * 0.10   Plugin with basic functionality created.
 *
 */
//=============================================================================

//=============================================================================
// Game_SkillGain - Contains rates for skill learning (weapon or skill)
//=============================================================================
function Game_SkillGain() {
    this.initialize.apply(this, arguments);
}

Game_SkillGain.prototype.initialize = function() {
    this.initRates();
};

Game_SkillGain.prototype.initRates = function() {
    this._itemId     = -1;
    this._skillRate = [];
};

Game_SkillGain.prototype.setItem = function(id) {
    this._itemId = id;
};

Game_SkillGain.prototype.getItem = function() {
    return this._itemId;
};

Game_SkillGain.prototype.setRate = function(key,rate) {
    this._skillRate[key] = rate;
};

Game_SkillGain.prototype.getRate = function(key) {
    if(this._skillRate[key])
        return this._skillRate[key];
    return 0;
};

Game_SkillGain.prototype.getAllRates = function() {
    return this._skillRate;
};


(function() {

    Compat.skillgains = [];
    Compat.weapongains = [];
    Compat.learned = false;

//=============================================================================
// Parameter Variables
//=============================================================================

    Compat.Parameters = PluginManager.parameters('SkillChance');
    Compat.BE.DefaultSkillRate = Number(Compat.Parameters['Default Chance']) / 100;
    Compat.BE.ConsumeOnLearn   = Compat.Parameters['Consume On Learn'];

//=============================================================================
// DataManager
//=============================================================================

    var extractMetadata = DataManager.extractMetadata;
    DataManager.extractMetadata = function(data) {
        extractMetadata.apply(this, arguments);
        var skill  = (data.speed || data.speed == 0) && (data.message1 || data.message1 == "");
        var weapon = (data.wtypeId || data.wtypeId == 0);

        if(skill || weapon) {
            var gains = new Game_SkillGain();
            gains.setItem(data.id);

            var learnIds   = [];
            var learnRates = [];

            for(var a in data.meta) {
                if(a.toLowerCase() == "learnchance") {
                    var temp = String(data.meta[a]).trim();
                    temp = temp.split(",");

                    for (var i = 0; i < temp.length; i++) {
                        learnIds.push(temp[i]);
                    }
                }
                else if(a.toLowerCase() == "learnrate") {
                    var temp = String(data.meta[a]).trim();
                    temp = temp.split(",");

                    for (var i = 0; i < temp.length; i++) {
                        var val = temp[i];
                        if(val == "" || val == " " || val == "-1") {
                            val = Compat.BE.DefaultSkillRate;
                        }
                        else {
                            val = val / 100;
                        }

                        learnRates.push(val);
                    }
                }
            }
            for(var j = 0; j < learnIds.length; j++) {
                var val = Compat.BE.DefaultSkillRate;
                if(learnRates[j]) {
                    val = learnRates[j];
                }
                gains.setRate(learnIds[j],val);
            }
            data.gains = gains;
            if(weapon)
                Compat.weapongains[data.id] = gains;
            else
                Compat.skillgains[data.id] = gains;
        }
    };


//=============================================================================
// BattleManager
//=============================================================================

    Compat.BE.BattleManager_processTurn = BattleManager.processTurn;
    BattleManager.processTurn = function() {
        var subject = this._subject;
        var action = subject.currentAction();
        if(subject._actorId && action) {
            var skill = action.item();
            var id = skill.id;
            var gains = null;
            if(id != subject.attackSkillId()) {
                gains = Compat.skillgains;
            }
            else {
                gains = Compat.weapongains;
                if(!subject.hasNoWeapons()) {
                    var weapons = subject.weapons();
                    for(var a in weapons) {
                        if(weapons[a].baseItemId) {
                            id = weapons[a].baseItemId;
                            break;
                        }
                    }
                }
            }

            if(gains[id]) {
                var rates = gains[id].getAllRates();
                for(var skillid in rates) {
                    var rand = Math.random();
                    if(!subject.isLearnedSkill(skillid) && rates[skillid] > rand) {
                        subject.learnSkill(skillid);
                        action.setSkill(skillid);
                        Compat.learned = true;
                        break;
                    }
                }
            }
        }
        Compat.BE.BattleManager_processTurn.call(this);
    };

//=============================================================================
// Game_Battler
//=============================================================================

    Compat.BE.Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        if(!Compat.BE.ConsumeOnLearn || !Compat.learned) {
            Compat.BE.Game_Battler_useItem.call(this,item);
        }
        Compat.learned = false;
    };

    Compat.BE.Window_BattleLog_startAction = Window_BattleLog.prototype.startAction;
    Window_BattleLog.prototype.startAction = function(subject, action, targets) {
       if(Compat.learned) {
//           console.log(subject);
           this.push('showLearnedBalloon', subject);
           this.push('waitForMovement');
       }
       Compat.BE.Window_BattleLog_startAction.call(this, subject, action, targets);
    };

    Window_BattleLog.prototype.showLearnedBalloon = function(subject) {
//        console.log(subject);
    };
})();