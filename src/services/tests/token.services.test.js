const FirebaseService = require("../firebase.services");
const TokenService = require("../token.services");
const spotifyApiMock = require("../../config/spotify.config").spotifyApi;

// mock the dependencies - Firebase and spotifyApi
jest.mock("../firebase.services");
jest.mock("../../config/spotify.config", () => ({
  // define what the spotifyApi object should look like and the functions it has
  spotifyApi: {
    setRefreshToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    setAccessToken: jest.fn(),
  },
}));

// when using mocked data, it must be cleared before each test to avoid conflicts - **replaced in config file**
beforeEach(() => {
  jest.clearAllMocks();
});

describe("Token refresh", () => {
  // 1 - test refresh token
  it("should successfully refresh the Spotify token", async () => {
    //////////////////////////////////////////////////////////////////////////
    // arrange the test data and mocks for this test
    //////////////////////////////////////////////////////////////////////////

    const userId = "testUserId123"; // needed for TokenService.refreshSpotifyToken(userId)
    const mockTokenData = {
      // data returned from the user document in Firestore
      spotify: {
        access_token: "old-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
      },
    };

    const mockApiResponse = {
      // response from Spotify API
      body: {
        access_token: "new-access-token",
        expires_in: 3600,
      },
      statusCode: 200,
    };

    // mock getDocument and its results using defined data above
    FirebaseService.getDocument.mockResolvedValue(mockTokenData);

    // define the mock response for the refreshAccessToken method in the spotifyApi object
    spotifyApiMock.refreshAccessToken.mockResolvedValue(mockApiResponse);

    //////////////////////////////////////////////////////////////////////////
    // act - call the method to be tested
    //////////////////////////////////////////////////////////////////////////

    const result = await TokenService.refreshSpotifyToken(userId);

    //////////////////////////////////////////////////////////////////////////
    // assert the expected outcomes - what should happen after the method is called
    //////////////////////////////////////////////////////////////////////////

    // check that the user document was retrieved from Firestore with the correct parameters (calledWith)
    expect(FirebaseService.getDocument).toHaveBeenCalledWith("users", userId);

    // spotify Api instance was set with the refresh token gotten from Firestore
    expect(spotifyApiMock.setRefreshToken).toHaveBeenCalledWith(
      "test-refresh-token"
    );

    // check that the spotifyApi refreshAccessToken method was called
    expect(spotifyApiMock.refreshAccessToken).toHaveBeenCalled();

    // check that the user document was updated in Firestore with the new token data
    // objectContaining - check specific fields were included in the update
    expect(FirebaseService.updateDocument).toHaveBeenCalledWith(
      "users",
      userId,
      expect.objectContaining({
        "spotify.access_token": "new-access-token",
        "spotify.expires_in": 3600,
        "spotify.last_updated": expect.any(Date), // accepts any date value
      })
    );

    // check that the spotifyApi instance was set with the new access token
    expect(spotifyApiMock.setAccessToken).toHaveBeenCalledWith(
      "new-access-token"
    );

    // check that TokenService.refreshSpotifyToken returned correct newTokenData
    expect(result).toEqual(
      expect.objectContaining({
        "spotify.access_token": "new-access-token",
        "spotify.expires_in": 3600,
        "spotify.last_updated": expect.any(Date),
      })
    );
  });

  // 2 - test refresh token failure (no refresh token)
  it("should throw an error if no refresh token is found", async () => {
    // arrange mock data
    const userId = "testUserId123"; // needed for TokenService.refreshSpotifyToken(userId)
    const mockTokenData = {
      // data returned from the user document in Firestore
      spotify: {
        access_token: "old-access-token",
        // MISSING REFRESH TOKEN
        expires_in: 3600,
      },
    };

    const mockApiResponse = {
      // response from Spotify API
      body: {
        access_token: "new-access-token",
        expires_in: 3600,
      },
      statusCode: 200,
    };

    // mock getDocument and its results using defined data above
    FirebaseService.getDocument.mockResolvedValue(mockTokenData);

    // define the mock response for the refreshAccessToken method in the spotifyApi object
    spotifyApiMock.refreshAccessToken.mockResolvedValue(mockApiResponse);

    // act and assert - missing refresh token data should throw error
    await expect(TokenService.refreshSpotifyToken(userId)).rejects.toThrow(
      "No refresh token available"
    );

    // check that the doc was queried
    expect(FirebaseService.getDocument).toHaveBeenCalledWith("users", userId);

    // check that spotifyApi was not called
    expect(spotifyApiMock.refreshAccessToken).not.toHaveBeenCalled;

    // check that firebase update was not called
    expect(FirebaseService.updateDocument).not.toHaveBeenCalled;
  });

  // 3 - test refresh token failure (no user doc found)
  it("should throw an error if no user document is found", async () => {
    // arrange mock data
    const userId = "invalid-userId";

    // mock getDocument returns null when user doc not found
    FirebaseService.getDocument.mockResolvedValue(null);

    // act and assert - missing refresh token data should throw error
    await expect(TokenService.refreshSpotifyToken(userId)).rejects.toThrow(
      // 2nd error message pass down from initial check if a refresh token exists
      "Token refresh failed - No refresh token available"
    );

    // check that the doc was queried
    expect(FirebaseService.getDocument).toHaveBeenCalledWith("users", userId);

    // check that spotifyApi was not called
    expect(spotifyApiMock).not.toHaveBeenCalled;

    // check that firebase update was not called
    expect(FirebaseService.updateDocument).not.toHaveBeenCalled;
  });

  // 4 - test refresh token failure (Spotify Api doesn't refresh token)
  it("should throw an error when the Spotify Api fails", async () => {
    // arrange mock data
    const userId = "testUserId123";

    const mockTokenData = {
      // data returned from the user document in Firestore
      spotify: {
        access_token: "old-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
      },
    };

    const mockApiResponse = {
      // response from spotifyApi
      message: "Invalid refresh token",
      statusCode: 401, // example error status code
    };

    // mock getDocument returns null when user doc not found
    FirebaseService.getDocument.mockResolvedValue(mockTokenData);

    // mock failed api call from Spotify
    spotifyApiMock.refreshAccessToken.mockRejectedValue(mockApiResponse);

    // act and assert - missing refresh token data should throw error
    await expect(TokenService.refreshSpotifyToken(userId)).rejects.toThrow(
      // 2nd error message pass down from initial check if a refresh token exists
      "Token refresh failed - Spotify API Error (401): Invalid refresh token"
    );

    // check that the doc was queried
    expect(FirebaseService.getDocument).toHaveBeenCalledWith("users", userId);

    // check that spotifyApi was not called
    expect(spotifyApiMock).not.toHaveBeenCalled;

    // check that firebase update was not called
    expect(FirebaseService.updateDocument).not.toHaveBeenCalled;
  });

  // 5 - test refresh token failure (Firebase update fails)
  //   it("should throw an error when the Firebase update fails", async () => {
  //     // arrange mock data
  //     const userId = "testUserId123";

  //     const mockTokenData = {
  //       // data returned from the user document in Firestore
  //       spotify: {
  //         access_token: "old-access-token",
  //         refresh_token: "test-refresh-token",
  //         expires_in: 3600,
  //       },
  //     };

  //     const mockApiResponse = {
  //       // response from Spotify API
  //       body: {
  //         access_token: "new-access-token",
  //         expires_in: 3600,
  //       },
  //       statusCode: 200,
  //     };

  //     // mock getDocument and its results using defined data above
  //     FirebaseService.getDocument.mockResolvedValue(mockTokenData);

  //     // define the mock response for the refreshAccessToken method in the spotifyApi object
  //     spotifyApiMock.refreshAccessToken.mockResolvedValue(mockApiResponse);

  //     // mock failed firebase update
  //     FirebaseService.updateDocument
  //       .mockRejectedValue
  //       //   new Error("Firebase update failed")
  //       ();

  //     // act and assert - missing refresh token data should throw error
  //     await expect(TokenService.refreshSpotifyToken(userId)).rejects.toThrow(
  //       "Token refresh failed - Firebase update failed"
  //     );

  //     // check that the doc was queried
  //     expect(FirebaseService.getDocument).toHaveBeenCalledWith("users", userId);

  //     // check that spotifyApi was not called
  //     expect(spotifyApiMock).not.toHaveBeenCalled;

  //     // check that firebase update was not called
  //     expect(FirebaseService.updateDocument).not.toHaveBeenCalled;
  //   });
});
