/*
The Gameboard represents the state of the board
Each equare holds a Cell (defined later)
and we expose a placeToken method to be able to add Cells to squares
*/

function Gameboard() {
    const rows = 3;
    const columns = 3;
    const board = [];

    // Create a 2d array that will represent the state of the game board
    // For this 2d array, row 0 will represent the top row and
    // column 0 will represent the left-most column.
    // This nested-loop technique is a simple and common way to create a 2d array.
    for (let i = 0; i < rows; i++) {
        board[i] = [];
        for (let j = 0; j < columns; j++) {
            board[i].push(Cell());
        }
    }

    // This will be the method of getting the entire board that our
    // UI will eventually need to render it.
    const getBoard = () => board;

    // In order to drop a token, we need to find what the lowest point of the
    // selected column is, *then* change that cell's value to the player number
    const placeToken = (row, column, player) => {

    // If no cells make it through the filter, 
    // the move is invalid. Stop execution.
        if (board[row][column].getValue() !== 0) {
            return false;
        }

    // Otherwise, I have a valid cell
        board[row][column].addToken(player);
        return true;
    };

    // This method will be used to print our board to the console.
    // It is helpful to see what the board looks like after each turn as we play,
    // but we won't need it after we build our UI
    const printBoard = () => {
        const boardWithCellValues = board.map((row) => row.map((cell) => cell.getValue()))
        console.log(boardWithCellValues);
    };

        const resetBoard = () => {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                board[i][j].reset();
            }
        }
    };


    // Here, we provide an interface for the rest of our
    // application to interact with the board
    return { getBoard, placeToken, printBoard, resetBoard };
}

/*
** A Cell represents one "square" on the board and can have one of
** 0: no token is in the square,
** 1: Player One's token,
** 2: Player 2's token
*/

function Cell() {
    let value = 0;

    // Accept a player's token to change the value of the cell
    const addToken = (player) => {
        value = player;
    };

    // How we will retrieve the current value of this cell through closure
    const getValue = () => value;

    const reset = () => {
    value = 0;
    };

    return {
        addToken,
        getValue,
        reset
    };
}

/* The GameController will be responsible for controlling the 
** flow and state of the game's turns, as well as whether
** anybody has won the game */
function GameController(
    playerOneName = "Player1",
    playerTwoName = "Player2"
    ) {
    const board = Gameboard();

    const players = [
        {
            name: playerOneName,
            token: 1
        },
        {
            name: playerTwoName,
            token: 2
        }
    ];

    let activePlayer = players[0];

    const switchPlayerTurn = () => {
    activePlayer = activePlayer === players[0] ? players[1] : players[0];
    };
    const getActivePlayer = () => activePlayer;

    const printNewRound = () => {
    board.printBoard();
    console.log(`${getActivePlayer().name}'s turn.`);
    };

    let gameOver = false;

    /*  This is where we would check for a winner and handle that logic,
    such as a win message. */
    const checkWinner = () => {
        const boardState = board.getBoard().map(row => row.map(cell => cell.getValue()));
        const winPatterns = [
            // Rows
            [[0, 0], [0, 1], [0, 2]],
            [[1, 0], [1, 1], [1, 2]],
            [[2, 0], [2, 1], [2, 2]],
            // Columns
            [[0, 0], [1, 0], [2, 0]],
            [[0, 1], [1, 1], [2, 1]],
            [[0, 2], [1, 2], [2, 2]],
            // Diagonals
            [[0, 0], [1, 1], [2, 2]],
            [[0, 2], [1, 1], [2, 0]]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            const valA = boardState[a[0]][a[1]];
            const valB = boardState[b[0]][b[1]];
            const valC = boardState[c[0]][c[1]];
            if (valA !== 0 && valA === valB && valB === valC) {
                return true;
            }
        }
        return false;
    };

        const playRound = (row, column) => {
        if (gameOver) {
            console.log("Game is already over!");
            return "Game over";
        }

        // Save activePlayer in as stable variable
        const currentPlayer = getActivePlayer(); 

        // Place a token for the current player
        console.log(`${currentPlayer.name} places token at (${row}, ${column})...`);

        const moveSuccess = board.placeToken(row, column, currentPlayer.token);
        if (!moveSuccess) {
            return "Cell already taken!";
        }

        if (checkWinner()) {
            board.printBoard();
            // Round finished
            console.log(`${currentPlayer.name} wins!`);
            gameOver = true;
            return `${currentPlayer.name} wins!`;
        }

        // Tie logic
        const boardState = board.getBoard().map(row => row.map(cell => cell.getValue()));
        const isBoardFull = boardState.every(row => row.every(cell => cell !== 0));
        if (isBoardFull) {
            board.printBoard();
            console.log("It's a tie!");
            gameOver = true;
            return "It's a tie!";
        }

        // Switch player turn
        switchPlayerTurn();
        return null;
    };

    const resetGame = () => {
        board.resetBoard();
        gameOver = false;
        activePlayer = players[0];
        printNewRound();
    };

    // Initial play game message
    printNewRound();

    // For the console version, we only use playRound, but we will need
    // getActivePlayer for the UI version
    return {
        playRound,
        getActivePlayer,
        // UI render
        getBoard: board.getBoard,
        // Preventing input after game has finished
        isGameOver: () => gameOver,
        resetGame,
    };
}

function ScreenController() {
    let game;

    const playerTurnDiv = document.querySelector('.turn');
    const boardDiv = document.querySelector('.gameboard');
    const startBtn = document.getElementById('startBtn');
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');

    function initGame() {
        const player1Name = player1Input.value.trim() || "Player 1";
        const player2Name = player2Input.value.trim() || "Player 2";

        game = GameController(player1Name, player2Name);

        updateScreen();
    }

    const updateScreen = () => {
        // clears the gameboard
        boardDiv.textContent = "";

        // get the newest version of the board and player turn
        const board = game.getBoard();
        const activePlayer = game.getActivePlayer();

        // Display player's turn
        playerTurnDiv.textContent = game.isGameOver()
            ? playerTurnDiv.textContent // Keep winner text
            : `${activePlayer.name}'s turn...`;

        // Render board squares
        board.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellButton = document.createElement("button");
                cellButton.classList.add("cell");
                cellButton.dataset.row = rowIndex;
                cellButton.dataset.column = colIndex;

                const value = cell.getValue();
                cellButton.textContent = value === 1 ? "X" : value === 2 ? "O" : "";

                // Disable button if already played
                if (game.isGameOver()) {
                    cellButton.disabled = true;
                }

                boardDiv.appendChild(cellButton);
            });
        });
    };

    // Add event listener for the board
    function clickHandlerBoard(e) {
        if (game.isGameOver()) return;

        const row = e.target.dataset.row;
        const column = e.target.dataset.column;

        if (row === undefined || column === undefined) return;

        const result = game.playRound(parseInt(row), parseInt(column));
        console.log("RESULT:", result); // <- Add this line for debugging

        // Show error message if cell was already taken
        if (result === "Cell already taken!") {
            playerTurnDiv.textContent = result;
            setTimeout(() => {
                playerTurnDiv.textContent = `${game.getActivePlayer().name}'s turn...`;
            }, 1000);
            return; // Skip updateScreen for invalid move
        }

        // Update the board only for valid moves
        updateScreen();

        // Show winner or tie
        if (result) {
            playerTurnDiv.textContent = result;
        }
    }

    boardDiv.addEventListener("click", clickHandlerBoard);
    startBtn.addEventListener("click", initGame);

    // Initial render
    initGame();
};

ScreenController();