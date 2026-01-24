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

    constructor() {
        super('Game');
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cameras.main.setBackgroundColor(0x00ff00);

        this.add.image(512, 384, 'background').setAlpha(0.5);

        this.add.image(512, 698, "cardPanel");

        this.buttons = this.add.container();
        for (let i = 1; i < 6; i++) {
            const btn = this.add.image(-42 + i*100, 698, "card-" + i.toString())
                .setInteractive({ useHandCursor: true })
                .setScrollFactor(0);

            btn.on('pointerover', () => btn.setAlpha(0.8));
            btn.on('pointerout', () => btn.setAlpha(1));
            btn.on('pointerdown', () => btn.setScale(0.95));
            btn.on('pointerup', () => btn.setScale(1));

            //  this.buttons.add([btn]);
        }

        // Create status text at the top
        this.statusText = this.add.text(512, 30, 'Connecting...', {
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
        let playerX=0;
        let playerY=0;
        for (let i = 1; i < 19; i++) {
            for (let j = 1; j < 12; j++) {
                const x = i * (HEX_WIDTH * 0.75);
                const y = j * HEX_HEIGHT + (i % 2) * (HEX_HEIGHT / 2) + 14;
                const tile = tile_map.create(x, y, 'tile');
                tile.door_list = [];

                for (let door_i = 0; door_i<6;door_i++) {
                    tile.door_list.push(this.mapRNG.integerInRange(0,2) === 0 ? 0 : 1);
                }

                if (i === 6 && j === 7){
                    playerX = x;
                    playerY = y;
                }

                tile
                    .setOrigin(0.5, 0.5)
                    .setDisplaySize(TILE_SIZE * HEIGHT_WIDTH_RATIO, TILE_SIZE)
                    .refreshBody()
                    .setInteractive({ useHandCursor: true });
            }
        }

        // Create both players
        this.player = this.physics.add.sprite(playerX, playerY, 'player');
        // this.player.setTint(0x00ff00); // Green for you

        // this.opponent = this.physics.add.sprite(900, 450, 'player');
        // this.opponent.setTint(0xff0000); // Red for opponent

        // Setup tile click handlers - FIXED: pass tile object correctly
        tile_map.children.iterate(tile => {
            tile.on("pointerdown", () => {
                this.onTileClick(tile);
            });
        });

        // this.anims.create({
        //     key: 'doorOpen',
        //     frameRate: 5,
        //     repeat: 3,
        //     frames: this.anims.generateFrameNames('tile', {start: 0, end: 3}),
        // })
        //
        // this.anims.create({
        //     key: 'doorClose',
        //     frameRate: 5,
        //     repeat: 3,
        //     frames: this.anims.generateFrameNames('tile', {start: 4, end: 7}),
        // })

        // Connect to WebSocket server
        // this.connectWebSocket();
    }

    // update(time, delta) {
    //     const p = this.input.activePointer;
    // }

    onTileClick (tile){
        const centerX = tile.x - HEX_WIDTH*HEIGHT_WIDTH_RATIO;
        const centerY = tile.y - HEX_HEIGHT;
        const vector = new Phaser.Math.Vector2(
            centerX - this.player.x,
            centerY - this.player.y
        );
        const distance = vector.length();
        const direction = vector.normalize()
        let index;
        console.log(distance, HEX_HEIGHT, HEX_WIDTH, HEX_WIDTH*0.8666)
        if (direction.x === 0){
            if (direction.y === 1){
                index = 3;
            } else {
                index = 0;
            }
        } else if (direction.x > 0){
            if (direction.y < 0){
                index = 1;
            } else {
                index = 2;
            }
        } else if (direction.x < 0){
            if (direction.y < 6){
                index = 5;
            } else {
                index = 4;
            }
        }
        if (distance < HEX_WIDTH * Math.sqrt(3) / 2) {
            const door_state =  tile.door_list[index];
            if (door_state === 0){
                //  tile.anims.play("doorClose");
                console.log("door band hai")
            } else {
                // tile.anims.play("doorOpen");
                console.log("door khula hai")
                this.player.setPosition(centerX, centerY);
            }
        }

    }

    connectWebSocket() {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            console.error('No auth token found');
            this.statusText.setText('Not authenticated!');
            return;
        }

        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws/game';
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('Connected to server');
            this.ws.send(JSON.stringify({
                type: 'authenticate',
                token: token
            }));
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.statusText.setText('Connection error!');
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.statusText.setText('Disconnected from server');
        };
    }

    handleServerMessage(data) {
        switch(data.type) {
            case 'authenticated':
                console.log('Authenticated as:', data.username);
                this.ws.send(JSON.stringify({ type: 'join' }));
                break;

            case 'waiting':
                this.statusText.setText('Waiting for opponent...');
                break;

            case 'gameStart':
                this.playerNumber = data.playerNumber;
                this.matchId = data.matchId;
                this.currentTurn = data.currentTurn;
                this.opponentUsername = data.opponentUsername;
                this.updateGameState(data.gameState);
                this.updateTurnDisplay();
                console.log(`Game started! You are Player ${this.playerNumber}`);
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
                this.statusText.setText(data.message);
                break;

            case 'error':
                console.error('Server error:', data.message);
                this.statusText.setText(`Error: ${data.message}`);
                break;
        }
    }

    updateGameState(gameState) {
        // Update positions based on player number
        if (this.playerNumber === 1) {
            // You are player 1
            this.player.setPosition(gameState.player1Position.x, gameState.player1Position.y);
            this.opponent.setPosition(gameState.player2Position.x, gameState.player2Position.y);
        } else {
            // You are player 2
            this.player.setPosition(gameState.player2Position.x, gameState.player2Position.y);
            this.opponent.setPosition(gameState.player1Position.x, gameState.player1Position.y);
        }
    }

    updateTurnDisplay() {
        const isMyTurn = this.currentTurn === this.playerNumber;
        const turnText = isMyTurn ? 'YOUR TURN' : `${this.opponentUsername}'S TURN`;
        const color = isMyTurn ? '#00ff00' : '#ff0000';

        this.statusText.setText(`Player ${this.playerNumber} - ${turnText}`);
        this.statusText.setColor(color);
    }

    handleTileClick(tile) {
        // Check if WebSocket is connected
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('Not connected to server');
            return;
        }

        // Check if game has started
        if (!this.playerNumber) {
            console.log('Game not started yet');
            return;
        }

        // Check if it's your turn
        if (this.currentTurn !== this.playerNumber) {
            console.log('Not your turn!');
            return;
        }

        // Get tile center position
        const centerX = tile.x;
        const centerY = tile.y;

        console.log(`Moving to tile at (${centerX}, ${centerY})`);

        // Send move to server
        this.ws.send(JSON.stringify({
            type: 'move',
            x: centerX,
            y: centerY,
            damage: this.selectedCard?.damage || 0,
            cardId: this.selectedCard?.id
        }));
    }

    handleGameEnd(data) {
        const message = data.isWinner ?
            `🎉 YOU WIN! 🎉` :
            `😢 ${data.winnerUsername} wins!`;

        this.statusText.setText(message);
        this.statusText.setFontSize(32);

        // Optionally: Add a restart button or return to menu
        this.time.delayedCall(3000, () => {
            // this.scene.start('Menu'); // Uncomment if you have a menu scene
        });
    }

    shutdown() {
        // Clean up WebSocket connection when scene closes
        if (this.ws) {
            this.ws.close();
        }
    }
}