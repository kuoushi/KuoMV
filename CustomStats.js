//=============================================================================
// Custom Stats
// CustomStats.js
// Version: 0.10.2
// Author: Kuoushi
//=============================================================================

var Compat = Compat || {};
Compat.BE = Compat.BE || {};

//=============================================================================
 /*:
 * @plugindesc v0.10.2 Allows for custom hidden stats that can be used in damage
 * formulas.
 * @author Kuoushi
 *
 * @param Custom Stats
 * @desc The short name (e.g. def, str, mhp) of the custom stat you wish to add.
 * @default str,int,dex,char
 *
 * @param Custom Stats Default Value
 * @desc The default value for all custom stats.
 * @default 0
 *
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin allows for the easy addition of custom stats to be used in
 * damage formulas and various other places. Simply add them to the plugin
 * parameter in the form of a comma-separated list and they'll be available
 * for use. If you want to give them a custom value then you'll need to create
 * a notetag on each specific actor in the form of:
 *
 * <stat: value>
 *
 * In the case of the default/example stats that I've included (feel free to
 * remove those, by the way), you could set the custom value for str on a
 * specific actor to 5 by going to that actor's notes and adding <str: 5>
 *
 * Currently these stats may only be modified by StatProg.js or other plugins
 * that do not override but do utilize the addParam function from BattlerBase.
 *
 * Warning, EVERYTHING IS CASE SENSITIVE.
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * 0.10.2 Code cleanup. Replaced unnecessary plugin variable storage.
 * 0.10.1 Small bugfix to fix stats saving and loading properly.
 * 0.10   Plugin is now compatible with my StatProg plugin. You may use any stats
 *        created in this plugin may be given a growth rate, min and max in
 *        StatProg. Also, the notetags have moved from the class notetags back to
 *        actors for consistency.
 * 0.05   Plugin with basic functionality created.
 *
 */
//=============================================================================


(function() {

//=============================================================================
// Parameter Variables
//=============================================================================

    Compat.Parameters = PluginManager.parameters('CustomStats');
    Compat.Param      = Compat.Param || {};

    Compat.Param.cStats  = String(Compat.Parameters['Custom Stats']).trim();
    Compat.Param.cStats  = Compat.Param.cStats.split(",");
    Compat.Param.cDefVal = Number(Compat.Parameters['Custom Stats Default Value']);

//=============================================================================
// DataManager
//=============================================================================

    var extractMetadata = DataManager.extractMetadata;
    DataManager.extractMetadata = function(data) {
        extractMetadata.apply(this, arguments);

        if(data.classId) {  // only actors
            var cparams = [];
            for(i = 0; i < Compat.Param.cStats.length; i++) {
                cparams[Compat.Param.cStats[i]] = Compat.Param.cDefVal;
            }

            for(var a in data.meta) {
                if(Compat.Param.cStats.indexOf(a.toLowerCase()) > -1) {
                  var val = parseInt(data.meta[a]);
                  cparams[a] = val;
                }
            }
            data.cparams = cparams;
        }
    };

    Compat.BE.DataManager_makeSaveContents = DataManager.makeSaveContents;
    DataManager.makeSaveContents = function() {
        $gameSystem.storeCustomStats(Compat.Param.cStats);
        return Compat.BE.DataManager_makeSaveContents.call(this);
    };

    Compat.BE.DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        Compat.BE.DataManager_extractSaveContents.call(this, contents);
        Compat.Param.cStats = $gameSystem.getCustomStats();
    };


    Game_System.prototype.storeCustomStats = function(val) {
        this.customStats    = val;
    };

    Game_System.prototype.getCustomStats = function() {
        return this.customStats;
    };

//=============================================================================
// Game_BattlerBase
//=============================================================================
    Compat.Param.cStats.forEach(function(key) {
        MVC.reader(Game_BattlerBase.prototype,key, function(){
            return this._cparam[key];
        });
    });
    
    Compat.BE.Game_BattlerBase_initMembers = Game_BattlerBase.prototype.initMembers;
    Game_BattlerBase.prototype.initMembers = function() {
        Compat.BE.Game_BattlerBase_initMembers.call(this);
        this._cparam = [];
    };

    Compat.BE.Game_BattlerBase_addParam = Game_BattlerBase.prototype.addParam;
    Game_BattlerBase.prototype.addParam = function(paramId, value) {
        if(typeof(paramId) == "number") {
          Compat.BE.Game_BattlerBase_addParam.call(this, paramId, value);
          return;
        }
        this._cparam[paramId] += value;
    }

    Compat.BE.Game_BattlerBase_param = Game_BattlerBase.prototype.param;
    Game_BattlerBase.prototype.param = function(paramId) {
        if(typeof(paramId) == "number") {
            return Compat.BE.Game_BattlerBase_param.call(this, paramId);
        }
        return this._cparam[paramId];
    };

//=============================================================================
// Game_Actor
//=============================================================================

    Compat.BE.Game_Actor_setupTwo = Game_Actor.prototype.setup;
    Game_Actor.prototype.setup = function(actorId) {
        Compat.BE.Game_Actor_setupTwo.call(this, actorId);
        this._cparam = $dataActors[actorId].cparams;
    };

})();