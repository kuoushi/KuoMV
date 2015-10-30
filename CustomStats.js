//=============================================================================
// Custom Stats
// CustomStats.js
// Version: 0.05
// Author: Kuoushi
//=============================================================================

var Compat = Compat || {};
Compat.BE = Compat.BE || {};

//=============================================================================
 /*:
 * @plugindesc v0.05 Allows for custom hidden stats that can be used in damage
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
 * a notetag on each specific class in the form of:
 *
 * <stat: value>
 * 
 * In the case of the default/example stats that I've included (feel free to
 * remove those, by the way), you could set the custom value for str on a
 * specific class to 5 by going to that class' notes and adding <str: 5>
 * 
 * Currently these stats cannot be changed any other way but I may update
 * this more in the future when the I need more functionality or as demand
 * requires.
 *
 * Warning, EVERYTHING IS CASE SENSITIVE.
 *
 * ============================================================================
 * Changelog
 * ============================================================================
 *
 * 0.05 Plugin with basic functionality created.
 *
 */
//=============================================================================


(function() {

//=============================================================================
// Parameter Variables
//=============================================================================

    Compat.Parameters = PluginManager.parameters('CustomStats');
    Compat.Param      = Compat.Param || {};
    Compat.cparam     = [];

    Compat.Param.cStats  = String(Compat.Parameters['Custom Stats']).trim();
    Compat.Param.cStats  = Compat.Param.cStats.split(",");
    Compat.Param.cDefVal = Number(Compat.Parameters['Custom Stats Default Value']);

//=============================================================================
// DataManager
//=============================================================================

    var extractMetadata = DataManager.extractMetadata;
    DataManager.extractMetadata = function(data) {
        extractMetadata.apply(this, arguments);

        if(data.learnings) {  // only classes
            Compat.cparam[data.id] = [];
            for(i = 0; i < Compat.Param.cStats.length; i++) {
                Compat.cparam[data.id][Compat.Param.cStats[i]] = Compat.Param.cDefVal;
            }

            for(var a in data.meta) {
                var val = parseInt(data.meta[a]);
                Compat.cparam[data.id][a] = val;
            }
        }
    };

//=============================================================================
// BattlerBase
//=============================================================================
    Compat.Param.cStats.forEach(function(key) {
        MVC.reader(Game_BattlerBase.prototype,key, function(){
            return this._getStat(key);
        });
    });

    Game_BattlerBase.prototype._getStat = function(k) {
        console.log(k);
        return Compat.cparam[this.currentClass().id][k];
    }

})();