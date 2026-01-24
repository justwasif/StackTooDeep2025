import { Scene } from 'phaser';
import { generateMoveProof } from '../utils/zkProver.js';

const HEIGHT_WIDTH_RATIO = Math.sqrt(2);
const HEX_WIDTH_RATIO = 1;
const TILE_SIZE = 100;
const HEX_WIDTH = TILE_SIZE * HEX_WIDTH_RATIO * HEIGHT_WIDTH_RATIO;
const HEX_HEIGHT = TILE_SIZE * HEX_WIDTH_RATIO;
const PLAYER_INDEX = 2;
const OPPONENT_INDEX = 7;
const Y_INDEX = 4;

export class Game extends Scene {
    player;
    opponent;
    cursors;
    ws;
    playerNumber;
    matchId;
    currentTurn;
    opponentUsername;
    statusText;
    active_tile;
    winning_tile;
    previousTile;
    activeCard = null;
    canRamDoor = false;
    usedCards = new Set();

    constructor() {
        super('Game');
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();

        // Get WebSocket from global reference
        this.ws = window.gameWebSocket;
        this.matchId = window.currentMatchId;

        this.add.image(512, 384, 'background');
        this.add.image(512, 698, "cardPanel");

        this.mapRNG = new Phaser.Math.RandomDataGenerator(["12345"]);

        // Create tile map
        const tile_map = this.physics.add.group();
        let playerX, playerY, opponentX, opponentY;
        if (this.playerNumber === 1){
            this.playerIndex = PLAYER_INDEX;
            this.opponentIndex = OPPONENT_INDEX;
        } else {
            this.playerIndex = OPPONENT_INDEX;
            this.opponentIndex = PLAYER_INDEX;
        }

        const allTiles = [];

        this.mapCommitment = [];
        for (let i = 2; i < 8; i++) {
            let mapRow =[];
            for (let j = 1; j < 5; j++) {
                const x = i * (HEX_WIDTH * 0.75);
                const y = j * HEX_HEIGHT + (i % 2) * (HEX_HEIGHT / 2) + 14;
                const tile = tile_map.create(x, y, 'tile');
                tile.door_list = [];
                tile.gridX = i;
                tile.gridY = j;

                for (let door_i = 0; door_i < 6; door_i++) {
                    tile.door_list.push(this.mapRNG.integerInRange(0, 3) === 0 ? 0 : 1);
                }
                mapRow.push(tile.door_list);
                if (i === this.playerIndex && j === Y_INDEX) {
                    playerX = x;
                    playerY = y;
                    this.active_tile = tile;
                    this.previousTile = tile;
                }

                if (i === this.opponentIndex && j === Y_INDEX) {
                    opponentX = x;
                    opponentY = y;
                }

                tile
                    .setOrigin(0.5, 0.5)
                    .setDisplaySize(TILE_SIZE * HEIGHT_WIDTH_RATIO, TILE_SIZE)
                    .refreshBody()
                    .setInteractive({ useHandCursor: true });

                allTiles.push(tile);
            }
            this.mapCommitment.push(mapRow);
        }

        // Select random winning tile (not starting positions)
        const validTiles = allTiles.filter(tile =>
            !(tile.gridX === this.playerIndex && tile.gridY === Y_INDEX) &&
            !(tile.gridX === this.opponentIndex && tile.gridY === Y_INDEX)
        );
        this.winning_tile = Phaser.Utils.Array.GetRandom(validTiles);
        console.log('Winning tile position:', this.winning_tile.gridX, this.winning_tile.gridY);

        // Create both players
        console.log(playerX, playerY, opponentX, opponentY);
        this.player = this.physics.add.sprite(playerX, playerY, 'player');
        this.opponent = this.physics.add.sprite(opponentX, opponentY, 'player');
        this.opponent.setTint(0xff0000);

        // Setup tile click handlers
        tile_map.children.iterate(tile => {
            tile.on("pointerdown", (pointer) => {
                this.onTileClick(tile, pointer);
            })
        });

        this.buttons = this.add.container();
        this.isCardAnimating = false;
        this.sfxCard = this.sound.add("cardSound", {volume: 1});

        for (let i = 1; i < 6; i++) {
            const btn = this.add.image(-42 + i*100, 698, "card-" + i.toString())
                .setInteractive({ useHandCursor: true })
                .setScrollFactor(0)
                .setDepth(1)
                .setScale(1);

            btn.cardNumber = i;
            btn.originalX = -42 + i*100;
            btn.originalY = 698;

            btn.on('pointerover', () => {
                if (!this.isCardAnimating && !this.usedCards.has(i)) btn.setAlpha(0.8);
            });
            btn.on('pointerout', () => {
                if (!this.isCardAnimating && !this.usedCards.has(i)) btn.setAlpha(1);
            });
            btn.on('pointerdown', () => {
                if (!this.isCardAnimating && !this.usedCards.has(i) && this.currentTurn === this.playerNumber) {
                    this.playCardAnimation(btn);
                }
            });

            this.buttons.add([btn]);
        }

        this.createShaders();

        // Card instruction text
        this.cardInstructionText = this.add.text(512, 650, '', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(300);
    }

    createShaders() {
        const doorBlockShaderCode = `
precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform vec2 playerPos;

varying vec2 fragCoord;

void main(void) {
    vec2 uv = fragCoord.xy;
    float dist = distance(uv, playerPos);
    float radius = ${HEX_HEIGHT.toFixed(2)};
    
    if (dist < radius) {
        float pulse = 0.5 + 0.5 * sin(time * 8.0);
        float intensity = (1.0 - dist / radius) * pulse;
        vec3 color = vec3(1.0, 0.0, 0.0) * intensity * 0.8;
        gl_FragColor = vec4(color, intensity * 0.6);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
        `;

        const doorOpenShaderCode = `
precision mediump float;

uniform float time;
uniform vec2 resolution;
uniform vec2 playerPos;

varying vec2 fragCoord;

float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main(void) {
    vec2 uv = fragCoord.xy;
    float dist = distance(uv, playerPos);
    float radius = ${HEX_HEIGHT.toFixed(2)};
    
    if (dist < radius) {
        vec2 particleUV = (uv - playerPos) * 0.05;
        float particle1 = random(floor(particleUV + time * 2.0));
        float particle2 = random(floor(particleUV - time * 1.5));
        
        float sparkle = step(0.92, particle1) * step(0.92, particle2);
        sparkle *= (1.0 - dist / radius);
        
        float glow = (1.0 - dist / radius) * 0.4;
        float wave = 0.5 + 0.5 * sin(time * 6.0 - dist * 0.05);
        
        vec3 color = vec3(0.2, 1.0, 0.5) * (glow + sparkle * 2.0) * wave;
        gl_FragColor = vec4(color, (glow + sparkle) * 0.8);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
        `;

        const doorBlockBaseShader = new Phaser.Display.BaseShader('DoorBlock', doorBlockShaderCode);
        const doorOpenBaseShader = new Phaser.Display.BaseShader('DoorOpen', doorOpenShaderCode);

        this.doorBlockShader = this.add.shader(doorBlockBaseShader, 0, 0, 1024, 768);
        this.doorBlockShader.setOrigin(0);
        this.doorBlockShader.setVisible(false);
        this.doorBlockShader.setDepth(100);

        this.doorOpenShader = this.add.shader(doorOpenBaseShader, 0, 0, 1024, 768);
        this.doorOpenShader.setOrigin(0);
        this.doorOpenShader.setVisible(false);
        this.doorOpenShader.setDepth(100);
    }

    playCardAnimation(card) {
        this.isCardAnimating = true;
        this.sfxCard.play();
        card.setDepth(200);

        const centerX = 512;
        const centerY = 384;
        const targetScale = 3;

        this.tweens.add({
            targets: card,
            x: centerX,
            y: centerY,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                card.setTint(0xffff00);
                this.time.delayedCall(300, () => {
                    card.clearTint();
                    this.tweens.add({
                        targets: card,
                        x: card.originalX,
                        y: card.originalY,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            card.setDepth(1);
                            this.isCardAnimating = false;
                            this.activateCard(card.cardNumber);
                        }
                    });
                });
            }
        });
    }

    activateCard(cardNumber) {
        console.log(`Card ${cardNumber} was used`);
        this.activeCard = cardNumber;
        this.usedCards.add(cardNumber);

        // Mark card as used visually
        this.buttons.list.forEach(btn => {
            if (btn.cardNumber === cardNumber) {
                btn.setTint(0x666666);
                btn.setAlpha(0.5);
            }
        });

        switch(cardNumber) {
            case 1: // Skip opponent's turn
                this.cardInstructionText.setText('Opponent\'s next turn will be skipped!');
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'skipTurn',
                        matchId: this.matchId
                    }));
                }
                this.time.delayedCall(2000, () => {
                    this.cardInstructionText.setText('');
                    this.activeCard = null;
                });
                break;

            case 2: // Ram through doors
                this.canRamDoor = true;
                this.cardInstructionText.setText('You can now move through closed doors! Make your move.');
                this.time.delayedCall(3000, () => {
                    if (this.canRamDoor) {
                        this.cardInstructionText.setText('');
                    }
                });
                break;

            case 3: // Block doors on any tile
                this.cardInstructionText.setText('Click on any tile to block 80% of its doors');
                // Will handle in onTileClick
                break;

            case 4: // Hot/Cold indicator
                this.checkHotCold();
                this.time.delayedCall(3000, () => {
                    this.cardInstructionText.setText('');
                    this.activeCard = null;
                });
                break;

            case 5: // Debug card
                console.log('Card 5 activated - Debug Info:');
                console.log('Current position:', this.active_tile.gridX, this.active_tile.gridY);
                console.log('Winning tile:', this.winning_tile.gridX, this.winning_tile.gridY);
                console.log('Distance to winning tile:', this.getDistance(this.active_tile, this.winning_tile));
                this.cardInstructionText.setText('Debug info logged to console');
                this.time.delayedCall(2000, () => {
                    this.cardInstructionText.setText('');
                    this.activeCard = null;
                });
                break;
        }
    }

    getDistance(tile1, tile2) {
        return Math.sqrt(
            Math.pow(tile1.x - tile2.x, 2) +
            Math.pow(tile1.y - tile2.y, 2)
        );
    }

    checkHotCold() {
        const currentDist = this.getDistance(this.active_tile, this.winning_tile);
        const previousDist = this.getDistance(this.previousTile, this.winning_tile);

        if (currentDist < previousDist) {
            this.cardInstructionText.setText('🔥 HOTTER! You\'re getting closer!');
            this.cardInstructionText.setColor('#ff4400');
        } else if (currentDist > previousDist) {
            this.cardInstructionText.setText('❄️ COLDER! You\'re moving away!');
            this.cardInstructionText.setColor('#4488ff');
        } else {
            this.cardInstructionText.setText('Same distance as before');
            this.cardInstructionText.setColor('#ffff00');
        }

        this.time.delayedCall(100, () => {
            this.cardInstructionText.setColor('#ffff00');
        });
    }

    async onTileClick(tile, pointer) {
        if (!this.player || this.currentTurn !== this.playerNumber) {
            console.log(this.player, this.playerNumber, this.currentTurn);
            return;
        }
        const centerX = tile.x;
        const centerY = tile.y;
        // Card 3: Block doors on selected tile
        if (this.activeCard === 3) {
            const doorsToBlock = Math.floor(tile.door_list.length * 0.8);
            const indices = [0, 1, 2, 3, 4, 5];
            Phaser.Utils.Array.Shuffle(indices);

            for (let i = 0; i < doorsToBlock; i++) {
                tile.door_list[indices[i]] = 0;
            }

            this.cardInstructionText.setText('Doors blocked!');

            // Visual feedback
            const flash = this.add.circle(centerX, centerY, HEX_WIDTH / 2, 0xff0000, 0.3);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 1000,
                onComplete: () => flash.destroy()
            });

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'blockDoors',
                    tileX: tile.gridX,
                    tileY: tile.gridY,
                    doorList: tile.door_list,
                    matchId: this.matchId
                }));
            }

            this.time.delayedCall(2000, () => {
                this.cardInstructionText.setText('');
                this.activeCard = null;
            });
            return;
        }

        // Normal movement logic
        const vector = new Phaser.Math.Vector2(
            centerX - this.player.x,
            centerY - this.player.y
        );
        const distance = vector.length();
        const direction = vector.normalize();
        let index;

        if (direction.x === 0) {
            index = direction.y === 1 ? 3 : 0;
        } else if (direction.x > 0) {
            index = direction.y < 0 ? 1 : 2;
        } else {
            index = direction.y < 6 ? 5 : 4;
        }
        console.log(distance, HEX_WIDTH * 0.8666);
        if (distance < HEX_WIDTH * Math.sqrt(3) / 2) {
            const door_state = this.active_tile.door_list[index];

            if (door_state === 0 && !this.canRamDoor) {
                console.log("Door is closed");
                this.showDoorBlockEffect();
            } else {
                if (this.canRamDoor && door_state === 0) {
                    console.log("Ramming through closed door!");
                    this.canRamDoor = false;
                    this.cardInstructionText.setText('');
                    this.activeCard = null;
                } else {
                    console.log("Door is open");
                }

                this.showDoorOpenEffect(pointer);
                this.previousTile = this.active_tile;
                this.active_tile = tile;

                const oldX = Math.floor(this.player.x);
                const oldY = Math.floor(this.player.y);
                const newX = Math.floor(centerX);
                const newY = Math.floor(centerY);

                // Show loading state
                if (this.statusText) {
                    this.statusText.setText('🔐 Generating proof...');
                }

                // Check if we have map commitment
                if (!this.mapCommitment) {
                    throw new Error('Map commitment not received from server');
                }

                // Prepare circuit inputs
                const zkInput = {
                    oldX: oldX,
                    oldY: oldY,
                    newX: newX,
                    newY: newY,
                    mapHash: this.mapCommitment.map_hash,
                    ramActive: 0, // TODO: Check if RAM card is active
                    mapGrid: this.mapCommitment.grid_layout,
                    salt: this.mapCommitment.map_salt
                };

                console.log('🔐 Starting proof generation...');

                // Generate the proof (this takes ~100-500ms)
                const {proof, publicSignals} = await generateMoveProof(zkInput);

                console.log('✅ Proof generated successfully!');

                // Update UI
                if (this.statusText) {
                    this.statusText.setText(
                        this.currentTurn === this.playerNumber ? 'YOUR TURN' : 'OPPONENT\'S TURN'
                    );
                }

                // Update local position
                this.player.setPosition(centerX, centerY);

                // Send move with proof to server
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'move',
                        x: newX,
                        y: newY,
                        matchId: this.matchId,
                        proof: proof,
                        publicSignals: publicSignals
                    }));

                    this.player.setPosition(centerX, centerY);

                    // Check if player reached winning tile
                    if (tile === this.winning_tile) {
                        this.handleWin();
                    }

                    // Send move to server
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify({
                            type: 'move',
                            x: centerX,
                            y: centerY,
                            matchId: this.matchId
                        }));
                    }
                }
            }
        }
    }

    handleWin() {
        this.statusText.setText('🎉 YOU REACHED THE WINNING TILE! 🎉');
        this.statusText.setFontSize(32);
        this.statusText.setColor('#00ff00');

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'win',
                matchId: this.matchId
            }));
        }
    }

    showDoorBlockEffect() {
        if (this.activeShader) {
            this.activeShader.setVisible(false);
        }

        console.log("Showing door block effect at:", this.player.x, this.player.y);
        this.doorBlockShader.x = this.player.x - this.player.width;
        this.doorBlockShader.y = this.player.y - 768 + this.player.height;
        this.doorBlockShader.setUniform('playerPos.x', this.player.x);
        this.doorBlockShader.setUniform('playerPos.y', this.player.y);
        this.doorBlockShader.setVisible(true);
        this.activeShader = this.doorBlockShader;

        this.time.delayedCall(800, () => {
            this.doorBlockShader.setVisible(false);
            this.activeShader = null;
        });
    }

    showDoorOpenEffect(pointer) {
        if (this.activeShader) {
            this.activeShader.setVisible(false);
        }

        console.log("Showing door open effect at:", this.player.x, this.player.y);
        this.doorOpenShader.x = pointer.x - this.player.width;
        this.doorOpenShader.y = pointer.y - 768 + this.player.height;
        this.doorOpenShader.setUniform('playerPos.x', this.player.x);
        this.doorOpenShader.setUniform('playerPos.y', this.player.y);
        this.doorOpenShader.setVisible(true);
        this.activeShader = this.doorOpenShader;

        this.time.delayedCall(1000, () => {
            this.doorOpenShader.setVisible(false);
            this.activeShader = null;
        });
    }

    handleServerMessage(data) {
        switch(data.type) {
            case 'authenticated':
                console.log('Game authenticated');
                break;

            case 'waiting':
                break;

            case 'gameStart':
                this.statusText = this.add.text(512, 30, 'Connecting to game...', {
                    fontFamily: 'Arial',
                    fontSize: 24,
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center'
                }).setOrigin(0.5);
                this.playerNumber = data.playerNumber;
                this.currentTurn = data.currentTurn;
                this.opponentUsername = data.opponentUsername;

                this.updateTurnDisplay();

                console.log(
                    `Game started! I am Player ${this.playerNumber}`,
                    data.gameState
                );
                break;

            case 'gameUpdate':
                this.updateGameState(data.gameState);
                this.currentTurn = data.currentTurn;
                this.updateTurnDisplay();
                break;

            case 'turnSkipped':
                this.statusText.setText('Your turn was skipped by opponent!');
                this.statusText.setColor('#ff0000');
                this.time.delayedCall(2000, () => {
                    this.updateTurnDisplay();
                });
                break;

            case 'doorsBlocked':
                // Update door state for the blocked tile
                if (data.tileX && data.tileY && data.doorList) {
                    this.updateTileDoors(data.tileX, data.tileY, data.doorList);
                }
                break;

            case 'gameEnd':
                this.handleGameEnd(data);
                break;

            case 'opponentDisconnected':
                this.statusText = this.add.text(512, 30, 'Connecting to game...', {
                    fontFamily: 'Arial',
                    fontSize: 24,
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center'
                }).setOrigin(0.5);
                this.statusText.setColor('#00ff00');
                break;

            case 'error':
                console.error('Server error:', data.message);
                this.statusText.setText(`Error: ${data.message}`);
                break;
        }
    }

    updateTileDoors(gridX, gridY, doorList) {
        // Find the tile and update its doors
        this.children.list.forEach(child => {
            if (child.gridX === gridX && child.gridY === gridY) {
                child.door_list = doorList;
                console.log(`Updated doors for tile (${gridX}, ${gridY})`);
            }
        });
    }

    updateGameState(gameState) {
        if (!gameState) return;

        if (this.playerNumber === 1) {
            if (gameState.player1Position) {
                this.player.setPosition(
                    gameState.player1Position.x,
                    gameState.player1Position.y
                );
            }
            if (gameState.player2Position) {
                this.opponent.setPosition(
                    gameState.player2Position.x,
                    gameState.player2Position.y
                );
            }
        } else {
            if (gameState.player2Position) {
                this.player.setPosition(
                    gameState.player2Position.x,
                    gameState.player2Position.y
                );
            }
            if (gameState.player1Position) {
                this.opponent.setPosition(
                    gameState.player1Position.x,
                    gameState.player1Position.y
                );
            }
        }
    }

    updateTurnDisplay() {
        if (!this.playerNumber) return;

        const isMyTurn = this.currentTurn === this.playerNumber;
        const turnText = isMyTurn ? 'YOUR TURN' : `${this.opponentUsername}'S TURN`;
        const color = isMyTurn ? '#00ff00' : '#ff0000';

        this.statusText.setText(`Player ${this.playerNumber} - ${turnText}`);
        this.statusText.setColor(color);
    }

    handleGameEnd(data) {
        const message = data.isWinner ?
            `🎉 YOU WIN! 🎉` :
            `😢 ${data.winnerUsername} wins!`;

        this.statusText.setText(message);
        this.statusText.setFontSize(32);

        this.time.delayedCall(5000, () => {
            window.location.href = 'http://localhost:5173/dashboard';
        });
    }

    shutdown() {
        if (this.ws) {
            this.ws.close();
        }
    }
}