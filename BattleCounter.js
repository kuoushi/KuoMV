//=============================================================================
// Battle Counter
// BattleCounter.js
// Version: 1.0
// Author: Kuoushi
//=============================================================================

var Compat = Compat || {};
Compat.VA = Compat.VA || {};

//=============================================================================
 /*:
 * @plugindesc Counts the number of battles that have taken place in the game.
 * @author Kuoushi
 *
 * @param Variable
 * @desc This is the variable used to store the battle counter.
 * Default: 1
 * @default 1
 *
 * @param After Victory
 * @desc Battles are counted only after a victory.
 * OFF - false     ON - true
 * @default true
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 *
 * This plugin counts the number of battles that have taken place and stores
 * the result into a variable specified by the user. Battles can be counted
 * when the battle starts or after victory.
 */
//=============================================================================

//=============================================================================
// Parameter Variables
//=============================================================================

Compat.Parameters = PluginManager.parameters('BattleCounter');
Compat.Param = Compat.Param || {};

Compat.Param.BCVariable = String(Compat.Parameters['Variable']);
Compat.Param.BCAfter = String(Compat.Parameters['After Victory']);

//=============================================================================
// BattleManager
//=============================================================================

Compat.VA.BattleManager_startBattle = BattleManager.startBattle;
BattleManager.startBattle = function() {
   if(!eval(Compat.Param.BCAfter)) {
      $gameVariables.setValue(Compat.Param.BCVariable, $gameVariables.value(Compat.Param.BCVariable) + 1);
   }
   Compat.VA.BattleManager_startBattle.call(this);
}


Compat.VA.BattleManager_endBattle = BattleManager.endBattle;
BattleManager.endBattle = function(result) {
   if(eval(Compat.Param.BCAfter) && result === 0) {
      $gameVariables.setValue(Compat.Param.BCVariable, $gameVariables.value(Compat.Param.BCVariable) + 1);
   }
   Compat.VA.BattleManager_endBattle.call(this,result);
}