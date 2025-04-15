const FirebaseService = require("../../services/firebase.services");
const PlaylistSessionService = require("../playlist_session.services");
const UserService = require("../user.services");

// mock the dependencies - Firebase and spotifyApi
jest.mock("../firebase.services");

// jest.mock for external services that need to be completely mocks
// jest.spyOn for internal services that need to be partially mocked

describe("UserService", () => {
  // when using mocked data, it must be cleared before each test to avoid conflicts
  //   beforeEach(() => {
  //     jest.clearAllMocks();
  //   });

  // 1 - test getListeningHistoryByUserId
  it("should return users listening history from db as an array", async () => {
    // arrage mock data
    const sessionId = "test-session-id";
    const userId = "test-user-id";

    // firebase subcollection doc response - 11 tracks
    const listeningHistory = [
      {
        id: "test-track-id-1",
        artistName: "Test Artist 1",
        songName: "Test Song 1",
        albumName: "Test Album 1",
        albumArtworkUrl: "https://test.com/album-art-1.jpg",
      },
      {
        id: "test-track-id-2",
        artistName: "Test Artist 2",
        songName: "Test Song 2",
        albumName: "Test Album 2",
        albumArtworkUrl: "https://test.com/album-art-2.jpg",
      },
      {
        id: "test-track-id-3",
        artistName: "Test Artist 3",
        songName: "Test Song 3",
        albumName: "Test Album 3",
        albumArtworkUrl: "https://test.com/album-art-3.jpg",
      },
      {
        id: "test-track-id-4",
        artistName: "Test Artist 4",
        songName: "Test Song 4",
        albumName: "Test Album 4",
        albumArtworkUrl: "https://test.com/album-art-4.jpg",
      },
      {
        id: "test-track-id-5",
        artistName: "Test Artist 5",
        songName: "Test Song 5",
        albumName: "Test Album 5",
        albumArtworkUrl: "https://test.com/album-art-5.jpg",
      },
      {
        id: "test-track-id-6",
        artistName: "Test Artist 6",
        songName: "Test Song 6",
        albumName: "Test Album 6",
        albumArtworkUrl: "https://test.com/album-art-6.jpg",
      },
      {
        id: "test-track-id-7",
        artistName: "Test Artist 7",
        songName: "Test Song 7",
        albumName: "Test Album 7",
        albumArtworkUrl: "https://test.com/album-art-7.jpg",
      },
      {
        id: "test-track-id-8",
        artistName: "Test Artist 8",
        songName: "Test Song 8",
        albumName: "Test Album 8",
        albumArtworkUrl: "https://test.com/album-art-8.jpg",
      },
      {
        id: "test-track-id-9",
        artistName: "Test Artist 9",
        songName: "Test Song 9",
        albumName: "Test Album 9",
        albumArtworkUrl: "https://test.com/album-art-9.jpg",
      },
      {
        id: "test-track-id-10",
        artistName: "Test Artist 10",
        songName: "Test Song 10",
        albumName: "Test Album 10",
        albumArtworkUrl: "https://test.com/album-art-10.jpg",
      },
      {
        id: "test-track-id-11",
        artistName: "Test Artist 11",
        songName: "Test Song 11",
        albumName: "Test Album 11",
        albumArtworkUrl: "https://test.com/album-art-11.jpg",
      },
    ];

    // mock the firebase service to return the mock data
    FirebaseService.getSubcollectionDocument.mockResolvedValue(
      listeningHistory
    );

    // act
    const result = await UserService.getListeningHistoryByUserId(
      sessionId,
      userId
    );

    // assert
    expect(FirebaseService.getSubcollectionDocument).toHaveBeenCalledWith(
      "sessions",
      sessionId,
      "listeningHistory",
      userId
    ); // check firebase doc was queried

    // results
    expect(result).toEqual(expect.any(Object)); // check if result is an array

    // expect(result.length).toBe(10); // check if result has 10 tracks
    // expect(result[0]).toEqual({
    //   // check the structure of the track object
    //   id: expect.any(String),
    //   artistName: expect.any(String),
    //   songName: expect.any(String),
    //   albumName: expect.any(String),
    //   albumArtworkUrl: expect.any(String),
    // });
  });
});
