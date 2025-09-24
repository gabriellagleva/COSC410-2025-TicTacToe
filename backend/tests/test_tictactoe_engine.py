import pytest

from app.tictactoe.engine import available_moves, move, new_game, status


def test_new_game_initial_state():
    gs = new_game()
    assert gs.board == [None] * 9
    assert gs.current_player == "X"
    assert gs.winner is None
    assert gs.is_draw is False
    assert status(gs) == "X's turn"


def test_valid_move_and_turn_switch():
    gs = new_game()
    gs = move(gs, 0, "X")
    assert gs.board[0] == "X"
    assert gs.current_player == "O"
    assert gs.winner is None
    assert not gs.is_draw


def test_cannot_play_occupied_cell():
    gs = new_game()
    gs = move(gs, 0, "X")
    with pytest.raises(ValueError):
        move(gs, 0, "X")


def test_winning_rows_cols_diagonals():
    # Row win
    gs = new_game()
    gs = move(gs, 0, "X")  # X
    gs = move(gs, 3, "O")  # O
    gs = move(gs, 1, "X")  # X
    gs = move(gs, 4, "O")  # O
    gs = move(gs, 2, "X")  # X wins
    assert gs.winner == "X"

    # Column win
    gs = new_game()
    gs = move(gs, 0, "X")  # X
    gs = move(gs, 1, "O")  # O
    gs = move(gs, 3, "X")  # X
    gs = move(gs, 2, "O")  # O
    gs = move(gs, 6, "X")  # X wins
    assert gs.winner == "X"

    # Diagonal win
    gs = new_game()
    gs = move(gs, 0, "X")  # X
    gs = move(gs, 1, "O")  # O
    gs = move(gs, 4, "X")  # X
    gs = move(gs, 2, "O")  # O
    gs = move(gs, 8, "X")  # X wins
    assert gs.winner == "X"


# def test_draw_condition():
#     gs = new_game()
#     # X O X
#     # X X O
#     # O X O
#     # sequence crafted to avoid earlier wins
#     seq = [0,1,2,5,3,6,4,8,7]
#     for i in seq:
#         move = "placeholder"
#         if i%2 == 1:
#             move = "X"
#         else:
#             move="O"
#         gs = move(gs, i, move)
#     assert gs.is_draw is True
#     assert gs.winner is


def test_available_moves_updates():
    gs = new_game()
    assert set(available_moves(gs)) == set(range(9))
    gs = move(gs, 4, "X")
    assert 4 not in available_moves(gs)
    assert len(available_moves(gs)) == 8


def test_game_over_disallows_moves():
    gs = new_game()
    gs = move(gs, 0, "X")  # X
    gs = move(gs, 3, "O")  # O
    gs = move(gs, 1, "X")  # X
    gs = move(gs, 4, "O")  # O
    gs = move(gs, 2, "X")  # X wins
    with pytest.raises(ValueError):
        move(gs, 8, "X")


# --------------------
# Router (FastAPI) tests
# --------------------
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.tictactoe.router import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_router_create_and_get_game():
    r = client.post("/tictactoe/new", json={"starting_player": "O"})
    assert r.status_code == 200
    data = r.json()
    gid = data["id"]
    assert data["current_player"] == "O"

    r = client.get(f"/tictactoe/{gid}")
    assert r.status_code == 200
    data2 = r.json()
    assert data2["id"] == gid
    assert data2["board"] == [None] * 9


def test_router_make_move_and_win_flow():
    r = client.post("/tictactoe/new", json={"starting_player": "X"})
    assert r.status_code == 200
    gid = r.json()["id"]

    # X at 0
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "move": "X"})
    assert r.status_code == 200
    # O at 3
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 3, "move": "O"})
    assert r.status_code == 200
    # X at 1
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 1, "move": "X"})
    assert r.status_code == 200
    # O at 4
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 4, "move": "O"})
    assert r.status_code == 200
    # X at 2 -> win
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 2, "move": "X"})
    assert r.status_code == 200
    data = r.json()
    assert data["winner"] == "X"
    assert data["status"].startswith("X wins")


def test_router_bad_requests_and_delete():
    # create game
    r = client.post("/tictactoe/new", json={})
    assert r.status_code == 200
    gid = r.json()["id"]

    # invalid index
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 99, "move": "X"})
    assert r.status_code == 400

    # occupy 0 then try again
    r_ok = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "move": "X"})
    assert r_ok.status_code == 200
    r = client.post(f"/tictactoe/{gid}/move", json={"index": 0, "move": "X"})
    assert r.status_code == 400

    # delete game works
    r = client.delete(f"/tictactoe/{gid}")
    assert r.status_code == 200
    assert r.json().get("ok") is True

    # delete missing returns ok False
    r = client.delete(f"/tictactoe/{gid}")
    assert r.status_code == 200
    body = r.json()
    assert body.get("ok") is False
    assert body.get("reason") == "not found"
