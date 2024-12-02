const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Move {
  constructor(name, type, power, category, usageLimit = Infinity) {
    this.name = name;
    this.type = type;
    this.power = power;
    this.category = category; // 'damage', 'stat', 'mega'
    this.usageLimit = usageLimit;
    this.usesLeft = usageLimit;
    this.statEffect = null;
  }
}

class Mon {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.stats = this.generateStats();
    this.currentStats = { ...this.stats }; // For tracking stat changes
    this.moves = this.generateMoves();
    this.currentHealth = this.stats.health;
  }

  generateStats() {
    return {
      health: Math.floor(Math.random() * 50) + 150, // 150-200 health
      attack: Math.floor(Math.random() * 20) + 40,  // 40-60 attack
      defense: Math.floor(Math.random() * 20) + 40, // 40-60 defense
      speed: Math.floor(Math.random() * 30) + 30    // 30-60 speed
    };
  }

  generateMoves() {
    const movePool = {
      water: [
        { name: 'Hydro Pump', power: 55 },
        { name: 'Aqua Blast', power: 50 },
        { name: 'Tidal Wave', power: 85, category: 'mega' }
      ],
      fire: [
        { name: 'Fire Blast', power: 55 },
        { name: 'Flame Thrower', power: 50 },
        { name: 'Inferno', power: 85, category: 'mega' }
      ],
      grass: [
        { name: 'Solar Beam', power: 55 },
        { name: 'Leaf Storm', power: 50 },
        { name: 'Frenzy Plant', power: 85, category: 'mega' }
      ],
      normal: [
        { name: 'Tackle', power: 50 },
        { name: 'Body Slam', power: 55 }
      ],
      stat: [
        { name: 'Defense Break', statEffect: { stat: 'defense', multiplier: 0.8 }},
        { name: 'Power Down', statEffect: { stat: 'attack', multiplier: 0.8 }}
      ]
    };

    const moves = [];
    
    // 1. Type-specific move
    const typeMove = movePool[this.type][Math.floor(Math.random() * (movePool[this.type].length - 1))];
    moves.push(new Move(typeMove.name, this.type, typeMove.power, 'damage'));

    // 2. Normal move
    const normalMove = movePool.normal[Math.floor(Math.random() * movePool.normal.length)];
    moves.push(new Move(normalMove.name, 'normal', normalMove.power, 'damage'));

    // 3. Stat move
    const statMove = movePool.stat[Math.floor(Math.random() * movePool.stat.length)];
    const statMoveObj = new Move(statMove.name, 'normal', 0, 'stat');
    statMoveObj.statEffect = statMove.statEffect;
    moves.push(statMoveObj);

    // 4. Mega move
    const megaMove = movePool[this.type][movePool[this.type].length - 1];
    moves.push(new Move(megaMove.name, this.type, megaMove.power, 'mega', 1));

    return moves;
  }
}

class Battle {
  constructor(mon1, mon2) {
    this.mon1 = mon1;
    this.mon2 = mon2;
    this.currentTurn = mon1.stats.speed >= mon2.stats.speed ? mon1 : mon2;
  }

  getTypeMultiplier(moveType, defenderType) {
    if (moveType === 'normal') return 1.0;
    
    const effectiveness = {
      water: { fire: 1.5, grass: 0.5, water: 1 },
      fire: { grass: 1.5, water: 0.5, fire: 1 },
      grass: { water: 1.5, fire: 0.5, grass: 1 }
    };
    return effectiveness[moveType]?.[defenderType] ?? 1.0;
  }

  calculateDamage(attacker, defender, move) {
    if (move.category === 'stat') return 0;

    const typeMultiplier = this.getTypeMultiplier(move.type, defender.type);
    const randomMultiplier = (Math.random() * 0.15) + 0.85;
    const attackDefenseRatio = attacker.currentStats.attack / defender.currentStats.defense;
    const movePowerFactor = move.power / 50;
    
    const baseDamage = (defender.stats.health * 0.15);
    
    const finalDamage = Math.floor(
      baseDamage * 
      typeMultiplier * 
      randomMultiplier * 
      attackDefenseRatio *
      movePowerFactor
    );

    console.log('\nDamage Calculation:');
    console.log(`Base Damage: ${baseDamage.toFixed(2)}`);
    console.log(`Type Multiplier: ${typeMultiplier}`);
    console.log(`Random Factor: ${randomMultiplier.toFixed(2)}`);
    console.log(`Attack/Defense Ratio: ${attackDefenseRatio.toFixed(2)}`);
    console.log(`Move Power Factor: ${movePowerFactor.toFixed(2)}`);
    console.log(`Final Damage: ${finalDamage}`);
    
    return Math.max(1, finalDamage);
  }

  applyStatEffect(attacker, defender, move) {
    if (move.category !== 'stat') return;

    const stat = move.statEffect.stat;
    const multiplier = move.statEffect.multiplier;
    defender.currentStats[stat] = Math.floor(defender.currentStats[stat] * multiplier);

    console.log(`\n${defender.name}'s ${stat} was reduced!`);
    console.log(`${stat}: ${Math.floor(defender.stats[stat])} -> ${defender.currentStats[stat]}`);
  }

  async executeTurn(move) {
    const attacker = this.currentTurn;
    const defender = this.currentTurn === this.mon1 ? this.mon2 : this.mon1;

    if (move.usesLeft <= 0) {
      console.log(`\n${move.name} cannot be used anymore!`);
      return false;
    }

    move.usesLeft--;
    
    if (move.category === 'stat') {
      this.applyStatEffect(attacker, defender, move);
    } else {
      const damage = this.calculateDamage(attacker, defender, move);
      defender.currentHealth = Math.max(0, defender.currentHealth - damage);
      
      console.log(`\n${attacker.name} used ${move.name} and dealt ${damage} damage to ${defender.name}!`);
      console.log(`${defender.name} has ${defender.currentHealth}/${defender.stats.health} health left.`);
    }
    
    this.currentTurn = defender;
    return defender.currentHealth === 0;
  }

  async displayMoveOptions() {
    const mon = this.currentTurn;
    console.log(`\n${mon.name}'s turn! Choose a move:`);
    mon.moves.forEach((move, index) => {
      const usesLeft = move.usageLimit === Infinity ? '∞' : move.usesLeft;
      console.log(`${index + 1}. ${move.name} (Power: ${move.power}, Type: ${move.type}, Uses left: ${usesLeft})`);
    });
  }
}

async function getPlayerInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function createMon(playerNum) {
  const name = await getPlayerInput(`Enter name for Player ${playerNum}'s mon: `);
  console.log('Choose type: 1. Water 2. Fire 3. Grass');
  const typeChoice = await getPlayerInput('Enter type number: ');
  const types = ['water', 'fire', 'grass'];
  const type = types[parseInt(typeChoice) - 1];
  
  const mon = new Mon(name, type);
  console.log(`\n${name}'s Stats:`, mon.stats);
  console.log('Moves:', mon.moves.map(m => `${m.name} (Power: ${m.power})`).join(', '), '\n');
  
  return mon;
}

async function startBattle() {
  console.log('Welcome to Mon Battle Simulator!\n');
  
  const mon1 = await createMon(1);
  const mon2 = await createMon(2);
  
  const battle = new Battle(mon1, mon2);
  let gameOver = false;

  while (!gameOver) {
    await battle.displayMoveOptions();
    const moveChoice = await getPlayerInput('Choose move (1 or 2): ');
    const selectedMove = battle.currentTurn.moves[parseInt(moveChoice) - 1];
    
    gameOver = await battle.executeTurn(selectedMove);
    
    if (gameOver) {
      const winner = mon1.currentHealth > 0 ? mon1 : mon2;
      console.log(`\n${winner.name} wins the battle!`);
      rl.close();
    }
  }
}

startBattle().catch(console.error);