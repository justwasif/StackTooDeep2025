import { Scene } from 'phaser';

const HEIGHT_WIDTH_RATIO = Math.sqrt(2);
const HEX_WIDTH_RATIO = 0.29;
const TILE_SIZE = 175;
const HEX_WIDTH = TILE_SIZE * HEX_WIDTH_RATIO * HEIGHT_WIDTH_RATIO;
const HEX_HEIGHT = TILE_SIZE * HEX_WIDTH_RATIO;

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

    constructor() {
        super('Game');
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cameras.main.setBackgroundColor(0x00ff00);

        this.add.image(512, 384, 'background').setAlpha(0.5);
        this.add.image(512, 698, "cardPanel");

        // Create status text at the top
        this.statusText = this.add.text(512, 30, 'Connecting to game...', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        this.mapRNG = new Phaser.Math.RandomDataGenerator(["12345"]);

        // Create tile map
        const tile_map = this.physics.add.group();
        let playerX = 0;
        let playerY = 0;

        for (let i = 1; i < 19; i++) {
            for (let j = 1; j < 12; j++) {
                const x = i * (HEX_WIDTH * 0.75);
                const y = j * HEX_HEIGHT + (i % 2) * (HEX_HEIGHT / 2) + 14;
                const tile = tile_map.create(x, y, 'tile');
                tile.door_list = [];

                for (let door_i = 0; door_i < 6; door_i++) {
                    tile.door_list.push(this.mapRNG.integerInRange(0, 2) === 0 ? 0 : 1);
                }

                if (i === 6 && j === 7) {
                    playerX = x;
                    playerY = y;
                    this.active_tile = tile;
                }

                tile
                    .setOrigin(0.5, 0.5)
                    .setDisplaySize(TILE_SIZE * HEIGHT_WIDTH_RATIO, TILE_SIZE)
                    .refreshBody()
                    .setInteractive({ useHandCursor: true });
            }
        }

        // Create both players
        // this.player = this.physics.add.sprite(playerX, playerY, 'player');
        // this.opponent = this.physics.add.sprite(900, 450, 'player');
        // this.opponent.setTint(0xff0000); // Red for opponent
        // this.opponent.setVisible(false); // Hide until game starts




        // Setup tile click handlers
        tile_map.children.iterate(tile => {
            tile.on("pointerdown", (pointer) => {
                this.onTileClick(tile, pointer);
            })
        });

        // Create animations
        this.anims.create({
            key: 'doorClose',
            frameRate: 5,
            repeat: 3,
            frames: this.anims.generateFrameNames('tile', {start: 1, end: 4}),
        });

        this.anims.create({
            key: 'doorOpen',
            frameRate: 5,
            repeat: 3,
            frames: this.anims.generateFrameNames('tile', {start: 5, end: 8}),
        });

        // Get WebSocket from global reference
        this.ws = window.gameWebSocket;
        this.matchId = window.currentMatchId;

        this.buttons = this.add.container();
        this.isCardAnimating = false;

        for (let i = 1; i < 6; i++) {
            const btn = this.add.image(-42 + i*100, 698, "card-" + i.toString())
                .setInteractive({ useHandCursor: true })
                .setScrollFactor(0)
                .setDepth(1);

            btn.cardNumber = i;
            btn.originalX = -42 + i*100;
            btn.originalY = 698;

            btn.on('pointerover', () => {
                if (!this.isCardAnimating) btn.setAlpha(0.8);
            });
            btn.on('pointerout', () => {
                if (!this.isCardAnimating) btn.setAlpha(1);
            });
            btn.on('pointerdown', () => {
                if (!this.isCardAnimating) {
                    this.playCardAnimation(btn);
                }
            });

            this.buttons.add([btn]);
        }

        this.createShaders();
    }

    createShaders() {
        // Red pulsing shader for door blocked
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

        // Green magical particles shader for door open
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
                            console.log(`Card ${card.cardNumber} was used`);
                        }
                    });
                });
            }
        });
    }

    onTileClick(tile, pointer) {
        const centerX = tile.x - HEX_WIDTH * HEIGHT_WIDTH_RATIO;
        const centerY = tile.y - HEX_HEIGHT;
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

        if (distance < HEX_WIDTH * Math.sqrt(3) / 2) {
            const door_state = this.active_tile.door_list[index];

            if (door_state === 0) {
                this.active_tile.anims.play("doorClose");
                console.log("Door is closed");
                this.showDoorBlockEffect();
            } else {
                this.active_tile.anims.play("doorOpen");
                console.log("Door is open");
                this.showDoorOpenEffect(pointer);

                this.active_tile = tile;
                this.player.setPosition(centerX, centerY);

                // Send move to server if WebSocket is connected
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
                this.statusText.setText('Waiting for opponent...');
                break;

            case 'waiting':
                this.statusText.setText('Waiting for opponent...');
                break;

            case 'gameStart':
                this.playerNumber = data.playerNumber;
                this.currentTurn = data.currentTurn;
                this.opponentUsername = data.opponentUsername;

                const { player1Position, player2Position } = data.gameState;

                // 🔥 CREATE BOTH SPRITES FROM SERVER STATE
                const p1 = this.physics.add.sprite(
                    player1Position.x,
                    player1Position.y,
                    'player'
                );

                const p2 = this.physics.add.sprite(
                    player2Position.x,
                    player2Position.y,
                    'player'
                );

                p2.setTint(0xff0000);

                // 🔥 ASSIGN "ME" AND "OPPONENT"
                if (this.playerNumber === 1) {
                    this.player = p1;
                    this.opponent = p2;
                } else {
                    this.player = p2;
                    this.opponent = p1;
                }

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

            case 'gameEnd':
                this.handleGameEnd(data);
                break;

            case 'opponentDisconnected':
                this.statusText.setText('Opponent disconnected. You win!');
                this.statusText.setColor('#00ff00');
                break;

            case 'error':
                console.error('Server error:', data.message);
                this.statusText.setText(`Error: ${data.message}`);
                break;
        }
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

        // Return to dashboard after 5 seconds
        this.time.delayedCall(5000, () => {
            window.location.href = 'http://localhost:5173/dashboard';
        });
    }

    shutdown() {
        // Clean up WebSocket connection when scene closes
        if (this.ws) {
            this.ws.close();
        }
    }
}