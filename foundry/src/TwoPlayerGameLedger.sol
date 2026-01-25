// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TwoPlayerGameLedger is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public admin;

    constructor(address _token) {
        token = IERC20(_token);
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }
    
    struct Game {
        address player1;
        address player2;
        uint256 pot;
        address winner;
        bool finished;
    }

    mapping(uint256 => Game) public games;

    // ---------------- DEPOSIT ----------------
    function deposit(uint256 gameId, uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");

        Game storage game = games[gameId];
        require(!game.finished, "Game finished");

        // Register players
        if (game.player1 == address(0)) {
            game.player1 = msg.sender;
        } else if (game.player2 == address(0)) {
            require(msg.sender != game.player1, "Already joined");
            game.player2 = msg.sender;
        } else {
            revert("Game full");
        }

        token.safeTransferFrom(msg.sender, address(this), amount);
        game.pot += amount;
    }

    // ---------------- DECLARE WINNER ----------------
    function declareWinner(uint256 gameId, address winner) external onlyAdmin {
        Game storage game = games[gameId];

        require(!game.finished, "Already finished");
        require(
            winner == game.player1 || winner == game.player2,
            "Winner not player"
        );

        game.winner = winner;
        game.finished = true;
    }

    // ---------------- WITHDRAW ----------------
    function withdraw(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];

        require(game.finished, "Game not finished");
        require(msg.sender == game.winner, "Not winner");
        require(game.pot > 0, "Already withdrawn");

        uint256 amount = game.pot;
        game.pot = 0;

        token.safeTransfer(msg.sender, amount);
    }
}
