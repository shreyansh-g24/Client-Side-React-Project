// Importing Modules
import React from "react";
import axios from "axios";
import setAuthToken, { getUserID, updateUserBookmarks, clearUserID } from "./utils/auth";
import uuvid4 from "uuid/v4";
import { Redirect } from "react-router-dom";
import Header from "./Header";
import "bulma/css/bulma.min.css";
import "./App.css";

// Importing components

// Declaring Component
class Me extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isResetPasswordOpen: false,
      isDeleteAccountOpen: false,
      oldPassword: "",
      newPassword: "",
      password: "",

      user: null,

      current_bookmarks_cc: {},
      profileUpdated: false,
      bookmarks_update_count: 0,
      updatedBookmarks: {},

    };
  }

  componentDidMount = () => {
    // requiring and updating user
    this.setState(
      { user: getUserID() },
      () => {
        // fetching current prices of bookmarks cc once the user's been loaded
        this.fetchData();
      }
    );
  }

  // fetching current prices and saving them in state
  fetchData = () => {
    let { bookmarks_cc } = this.state.user;
    let bookmarks = JSON.parse(bookmarks_cc);

    bookmarks.forEach(cc => {
      fetch(cc.url)
        .then(res => res.json())
        .then(data => {
          let { current_bookmarks_cc } = this.state;
          current_bookmarks_cc[cc.ticker] = data.price;
          // updating current bookmark prices in state
          this.setState({ current_bookmarks_cc: current_bookmarks_cc });
          return 0;
        })
        .catch(e => {
          let { current_bookmarks_cc } = this.state;
          current_bookmarks_cc[cc.ticker] = "Unable to fetch data!";
          // updating current bookmarks price state
          this.setState({ current_bookmarks_cc: current_bookmarks_cc });
          return 0;
        });
    });
  }

  handleBookmarkChange = (event) => {
    // extracting states
    let { bookmarks_update_count, updatedBookmarks, profileUpdated } = this.state;

    // resetting updated count and profilepdated boolean
    bookmarks_update_count = 0;
    profileUpdated = false;
    // updating updated bookmarks list
    updatedBookmarks[event.target.dataset.ccticker] = !updatedBookmarks[event.target.dataset.ccticker];
    // updating updated bookmarks count
    for (let key in updatedBookmarks) {
      if (updatedBookmarks[key]) {
        bookmarks_update_count++;
        profileUpdated = true;
      }
    }

    this.setState({
      updatedBookmarks: updatedBookmarks,
      bookmarks_update_count: bookmarks_update_count,
      profileUpdated: profileUpdated,
    });
  }

  handleSavePreferences = () => {
    // extracting states
    let { updatedBookmarks } = this.state;

    // counter to count interations
    let counter = Object.keys(updatedBookmarks).length;

    // updating bookmark status on server
    for (let key in updatedBookmarks) {
      // decrementing counter
      counter--;

      // updating bookmarked cc on server if updated true
      if (updatedBookmarks[key]) {
        // creating bookmark object
        let bookmark = {
          bookmarkType: "Crypto-Currency",
          ticker: key,
          url: "",
          bookmarkedPrice: 0,
          bookmarkedDate: 0,
        };

        // making a post request
        setAuthToken();
        axios.post("/users/bookmarks/update", {
          data: { isBookmarked: false, bookmark },
        })
          .then(data => {
            if (data.data.success) {
              // alert("Update successful!");
              return true;
            }
            else if (!data.data.success) {
              // alert("Failed to save changes!");
              return false;
            };
          })
          .catch(e => {
            alert("Unable to update bookmark, try again later!");
            console.log("Unexpected error occurred while trying to update the bookmark: ", e);
            return false;
          });
      }
      // if through with all updated bookmarks, fetching and saving updated bookmark info
      if (counter === 0) {
        this.setState({
          user: getUserID(),
        });
      }
    }
    // resetting bookmark update state for cc
    this.setState({
      bookmarks_update_count: 0,
      profileUpdated: false,
      updatedBookmarks: {},
    });
  }

  // reset user password
  handlePasswordReset = () => {
    this.setState({ isResetPasswordOpen: !this.state.isResetPasswordOpen });
  }

  // deletes user account
  handleDeleteAccount = () => {
    this.setState({ isDeleteAccountOpen: !this.state.isDeleteAccountOpen });
  }

  // handles input value change
  handleInputChange = (event) => {
    let name = event.target.name;
    this.setState({ [name]: event.target.value });
  }

  // handling password change button click
  handleProfileUpdateClick = (event) => {
    let { oldPassword, newPassword, password } = this.state;
    let url, data;
    if(event.target.name === "changePassword") {
      data = {
        oldPassword, 
        newPassword,
      };
      url = "/users/update/password";
    }
    else if(event.target.name === "deleteAccount") {
      data = {
        password
      }; 
      url = "/users/delete";
    }
    setAuthToken();
    axios.post(url, {
      data: data
    })
      .then(res => res.data)
      .then(data => {
        if(data.success) {
          alert("Request fulfilled!");
        }
        else if(!data.success) {
          alert("Request denied, " + data.err);
        }
        this.setState({
          oldPassword: "",
          newPassword: "",
          password: "",
          isResetPasswordOpen: false,
          isDeleteAccountOpen: false,
        });
        return data.success;
      })
      .catch(e => {
        alert("Encountered Error while trying to fulfill the request.");
        this.setState({
          oldPassword: "",
          newPassword: "",
          password: "",
          isResetPasswordOpen: false,
          isDeleteAccountOpen: false,
        });
        console.log("Me.js: ", e);
        return false;
      })
      .then(status => {
        if(status){
          clearUserID();
          this.props.history.push("/login/auth");
        }
      });
  }

  render() {
    // extracting information
    let { handleBookmarkChange, handleSavePreferences } = this;
    let { username, bookmarks_cc, email } = this.state.user ? this.state.user : { username: null, email: null, bookmarks_cc: null };
    let { current_bookmarks_cc, updatedBookmarks, profileUpdated, isResetPasswordOpen, isDeleteAccountOpen, oldPassword, newPassword, password } = this.state;

    // calculating classes
    let savePreferencesBtnClass = profileUpdated ? "button is-info is-small" : "button in-info is-hidden is-small";
    let resetPasswordModalClass = isResetPasswordOpen ? "is-block modal" : "display-none modal";
    let deleteAccountModalClass = isDeleteAccountOpen ? "is-block modal" : "display-none modal";

    // authenticating user login
    if (!getUserID().token) return (
      <Redirect to="/login/auth" />
    );

    // returning JSx if logged in
    return (
      <div>

        <Header title="Profile Page" />

        {/* Modal Box for Password Reset */}
        <div id="myModal" className={resetPasswordModalClass}>

          <div className="modal-content modal-content-border-resetPass has-background-light">
            <span onClick={this.handlePasswordReset} className="close has-text-danger">&times;</span>
            <p className="subtitle">Enter current and new passwords: </p>
            <input value={oldPassword} onChange={this.handleInputChange} className="input is-info margin-bottom-20px" type="text" name="oldPassword" placeholder="Current Password: " required />
            <input value={newPassword} onChange={this.handleInputChange} className="input is-info margin-bottom-20px" type="text" name="newPassword" placeholder="New Password: " required />
            <a onClick={this.handleProfileUpdateClick} className="button is-link" name="changePassword">Save Changes</a>
          </div>

        </div>
        {/* Modal Box for Deleting user account */}
        <div id="myModal" className={deleteAccountModalClass}>

          <div className="modal-content modal-content-border-deleteAcc has-background-light">
            <span onClick={this.handleDeleteAccount} className="close has-text-danger">&times;</span>
            <p className="subtitle">Enter password to confirm: </p>
            <input value={password} onChange={this.handleInputChange} className="input is-danger margin-bottom-20px" type="text" name="password" placeholder="Password: " required />
            <a onClick={this.handleProfileUpdateClick} name="deleteAccount" className="button is-danger">Delete account!</a>
          </div>

        </div>

        <div className="container box padding-40px margin-bottom-20px">
          <h2 className="title">About</h2>
          <pre><span className="has-text-weight-semibold">Username:</span> {username ? username : ""}</pre>
          <pre className="margin-bottom-20px"><span className="has-text-weight-semibold">Email:</span> {email ? email : ""}</pre>
          <a onClick={this.handlePasswordReset} className="button is-info is-small margin-right-20px">Change Password</a>
          <a onClick={this.handleDeleteAccount} className="button is-danger is-small">Delete Account</a>
        </div>

        <div className="container padding-40px margin-bottom-20px">
          <h2 className="title">Preferences</h2>
          <div>

            <h3 className="subtitle">Bookmarked CryptoCurrencies:</h3>

            <table className="table is-striped is-bordered container margin-center margin-bottom-20px">

              <thead>
                <tr>
                  <th>Crypto-Currency (Ticker)</th>
                  <th>Date when bookmarked</th>
                  <th>Price when bookmarked</th>
                  <th>Current Price</th>
                  <th>Remove bookmark?</th>
                </tr>
              </thead>

              <tbody>

                {

                  (function () {

                    let bookmarks = JSON.parse(bookmarks_cc);

                    // if no bookmarks found
                    if (!bookmarks || bookmarks.length === 0) return (<tr><td colSpan="5">No Crypto-Currencies bookmarked yet!</td></tr>);

                    // if bookmarks found, calculates resultant JSx with prices
                    let result = bookmarks.map(cc => {

                      // calculating classes
                      let buttonClass = updatedBookmarks[cc.ticker] ? "button is-primary is-small" : "button is-danger is-small";
                      let buttonText = updatedBookmarks[cc.ticker] ? "Re-bookmark" : "Remove";

                      return (

                        <tr key={uuvid4()}>
                          <td className="has-text-weight-semibold">{cc.ticker}</td>
                          <td>{cc.bookmarkedDate}</td>
                          <td>{cc.bookmarkedPrice}</td>

                          {
                            (function () {

                              // default if the current bookmarked cc price of the selected doesn't exist
                              if (!current_bookmarks_cc[cc.ticker]) return (<td><a className="button is-warning is-loading no-borders has-background-white">Loading</a></td>)

                              // calculating result
                              let currentPriceClass = !Number(current_bookmarks_cc[cc.ticker]) || current_bookmarks_cc[cc.ticker] < cc.bookmarkedPrice ? "has-text-danger" : "has-text-success";

                              return (
                                <td className={currentPriceClass}>{current_bookmarks_cc[cc.ticker]}</td>
                              );

                            })()
                          }

                          <td><a data-ccticker={cc.ticker} onClick={(event) => handleBookmarkChange(event)} className={buttonClass}>{buttonText}</a></td>
                        </tr>

                      );
                    });

                    // returning calculated result
                    return result;
                  })()

                }

              </tbody>

            </table>

          </div>

          <a onClick={handleSavePreferences} className={savePreferencesBtnClass}>Save Preferences</a>
        </div>


      </div>
    );
  }
}

// Exporting Component
export default Me;
