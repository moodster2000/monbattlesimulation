const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Mon {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.stats = this.generateStats();
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
        { name: 'Aqua Blast', power: 45 },
        { name: 'Hydro Pump', power: 55 },
        { name: 'Water Whip', power: 40 },
        { name: 'Bubble Beam', power: 50 }
      ],
      fire: [
        { name: 'Flame Thrower', power: 50 },
        { name: 'Fire Blast', power: 55 },
        { name: 'Ember', power: 40 },
        { name: 'Heat Wave', power: 45 }
      ],
      grass: [
        { name: 'Leaf Strike', power: 45 },
        { name: 'Solar Beam', power: 55 },
        { name: 'Root Bind', power: 40 },
        { name: 'Vine Whip', power: 50 }
      ],
      normal: [
        { name: 'Quick Attack', power: 45 },
        { name: 'Tackle', power: 50 },
        { name: 'Slam', power: 55 },
        { name: 'Body Slam', power: 40 }
      ]
    };
  
    const moves = [];
    
    // Get one move of mon's type
    const typeMove = movePool[this.type][Math.floor(Math.random() * movePool[this.type].length)];
    moves.push({
      name: typeMove.name,
      type: this.type,
      power: typeMove.power
    });
  
    // Get one normal move
    const normalMove = movePool.normal[Math.floor(Math.random() * movePool.normal.length)];
    moves.push({
      name: normalMove.name,
      type: 'normal',
      power: normalMove.power
    });
    
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
    // If it's a normal move, it has no type advantages
    if (moveType === 'normal') return 1.0;
    
    const effectiveness = {
      water: { fire: 1.5, grass: 0.5, water: 1 },
      fire: { grass: 1.5, water: 0.5, fire: 1 },
      grass: { water: 1.5, fire: 0.5, grass: 1 }
    };
    return effectiveness[moveType]?.[defenderType] ?? 1.0;
  }

  calculateDamage(attacker, defender, move) {
    // New balanced damage formula:
    // Base damage is 15-20% of defender's max health for a neutral hit
    
    const typeMultiplier = this.getTypeMultiplier(move.type, defender.type);
    const randomMultiplier = (Math.random() * 0.15) + 0.85; // 0.85-1.0
    const attackDefenseRatio = attacker.stats.attack / defender.stats.defense;
    const movePowerFactor = move.power / 50; // Normalize move power around 50
    
    const baseDamage = (defender.stats.health * 0.15); // 15% of max health
    
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

  async executeTurn(move) {
    const attacker = this.currentTurn;
    const defender = this.currentTurn === this.mon1 ? this.mon2 : this.mon1;
    
    const damage = this.calculateDamage(attacker, defender, move);
    defender.currentHealth = Math.max(0, defender.currentHealth - damage);
    
    console.log(`\n${attacker.name} used ${move.name} and dealt ${damage} damage to ${defender.name}!`);
    console.log(`${defender.name} has ${defender.currentHealth}/${defender.stats.health} health left.\n`);
    
    this.currentTurn = defender;
    return defender.currentHealth === 0;
  }

  async displayMoveOptions() {
    const mon = this.currentTurn;
    console.log(`${mon.name}'s turn! Choose a move:`);
    mon.moves.forEach((move, index) => {
      console.log(`${index + 1}. ${move.name} (Power: ${move.power}, Type: ${move.type})`);
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