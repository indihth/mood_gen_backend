const session = require("express-session");
const FirebaseService = require("../../services/firebase.services");

const PlaylistSessionService = require("../playlist_session.services");
const PlaylistSessionController = require("../../controllers/playlist_session.controller");
const UserService = require("../user.services");

// mock the dependencies - Firebase and spotifyApi
jest.mock("../firebase.services");
// jest.spyOn("../playlist_session.services", "addUserToSession");

describe("PlaylistSessionService", () => {
  // 1 - Add user to session
  describe("add a user to a session", () => {
    let addUserSpy;
    describe("where the user is host and is successful", () => {
      it("should add a user to the session and return message with session data", async () => {
        // arrange mock data
        const getUserDataAndHistorySpy = jest
          .spyOn(UserService, "getUserDataAndHistory")
          .mockResolvedValue({
            // mock the data returned by from getUserDataAndHistory because it has a Spotify API dependency
            userData: {
              "test-user-id": {
                userId: "test-user-id",
                displayName: "Test User",
                product: "premium",
                isAdmin: true,
                joinedAt: Date.now(),
              },
            },
            historyData: {
              "test-track-id": {
                artistName: "Test Artist",
                songName: "Test Song",
                albumName: "Test Album",
                albumArtworkUrl: "https://test.com/album-art.jpg",
              },
            },
          });

        const addUserSpy = jest.spyOn(
          PlaylistSessionService,
          "addUserToSession"
        );

        // mock firebase methods because they have a firestore dependencies
        FirebaseService.addToDocument.mockResolvedValue();
        FirebaseService.setDocumentInSubcollection.mockResolvedValue();
        FirebaseService.getDocument.mockResolvedValue({
          sessionName: "Test Session",
          description: "Test Description",
          hostId: "test-user-id",
          users: {
            "test-user-id": { displayName: "Test Host" },
          },
        });

        // call the method to test
        const result = await PlaylistSessionService.addUserToSession(
          "test-session-id",
          "test-user-id",
          true
        );

        // check methods were called
        expect(addUserSpy).toHaveBeenCalled();

        expect(getUserDataAndHistorySpy).toHaveBeenCalled();

        expect(FirebaseService.addToDocument).toHaveBeenCalled();

        // check firestore subcollection was called using the returned historyData
        expect(FirebaseService.setDocumentInSubcollection).toHaveBeenCalledWith(
          "sessions",
          "test-session-id",
          "listeningHistory",
          "test-user-id",
          {
            "test-track-id": {
              artistName: "Test Artist",
              songName: "Test Song",
              albumName: "Test Album",
              albumArtworkUrl: "https://test.com/album-art.jpg",
            },
          }
        );

        expect(FirebaseService.getDocument).toHaveBeenCalled();

        // check result are in the correct object format
        expect(result).toMatchObject({
          userData: expect.any(Object),
          sessionData: {
            sessionName: expect.any(String),
            description: expect.any(String),
            hostDisplayName: expect.any(String),
          },
        });
      });
    });

    describe("where the user is host and is unsuccessful", () => {
      it("should throw an error when getUserDataAndHistory fails", async () => {
        // arrange mock data
        const getUserDataAndHistorySpy = jest
          .spyOn(UserService, "getUserDataAndHistory")
          .mockRejectedValue(new Error("Failed to get user data and history"));

        const addUserSpy = jest.spyOn(
          PlaylistSessionService,
          "addUserToSession"
        );

        // call and check it throws
        await expect(
          PlaylistSessionService.addUserToSession(
            "test-session-id",
            "test-user-id",
            true
          )
        ).rejects.toThrow(
          "Failed to add user to session: Failed to get user data and history"
        );

        // verify spies were called
        expect(addUserSpy).toHaveBeenCalled();
        expect(getUserDataAndHistorySpy).toHaveBeenCalled();

        // verify firebase methods were not called since error was thrown
        expect(FirebaseService.addToDocument).not.toHaveBeenCalled();
        expect(
          FirebaseService.setDocumentInSubcollection
        ).not.toHaveBeenCalled();
        expect(FirebaseService.getDocument).not.toHaveBeenCalled();
      });
    });
  });
});
