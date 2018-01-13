import Inferno from 'inferno';
import Component from 'inferno-component';
import PropTypes from 'prop-types';
import marked from 'marked';
import store from 'store';

import { Modal } from '../../structure/Modal';
import { SearchBox } from '../../management/SearchBox';

import { request } from '../../../Helpers';

export class LoginForm extends Component {
  constructor (props) {
    super(props);

    PropTypes.checkPropTypes({
      logIn: PropTypes.func.isRequired,
      signUp: PropTypes.func.isRequired,
    }, props, 'prop', 'LoginForm');

    this.state = {
      visibleTab: 'login',
      loginEmail: '',
      loginPassword: '',
      loginEmailError: '',
      loginPasswordError: '',
      signupEmail: '',
      signupUsername: '',
      signupPublicName: '',
      signupPassword: '',
      signupConfirm: '',
      signupAllowEmail: true,
      signupEmailError: '',
      signupUsernameError: '',
      signupPasswordError: '',
      signupConfirmError: '',
      signupEmailChecking: false,
      signupUsernameChecking: false,
      signupEmailIsUnique: true,
      signupUsernameIsUnique: true,
    };
  }

  changeTab (tab) {
    this.setState({ visibleTab: tab });
  }

  updateField (field, event) {
    const requiredFields = ['loginEmail', 'loginPassword', 'signupEmail', 'signupPassword', 'signupConfirm'];
    const {value, checked} = event.target;
    const fieldUpdate = {};
    const errorFieldName = `${field}Error`;
    let isValid = true;
    if (requiredFields.includes(field)) {
      if (value === '') {
        isValid = false;
        fieldUpdate[errorFieldName] = 'This field must not be blank';
      } else if (field.includes('Email') && !/.+@.+/g.test(value)) {
        isValid = false;
        fieldUpdate[errorFieldName] = 'The email address you entered looks wrong';
      } else if (field === 'signupPassword' && value.length < 6) {
        isValid = false;
        fieldUpdate[errorFieldName] = 'Please make your password at least 6 characters long';
      } else if ((field === 'signupPassword' && value !== this.state.signupConfirm)
        || (field === 'signupConfirm' && value !== this.state.signupPassword)) {
        isValid = false;
        fieldUpdate[errorFieldName] = 'Your passwords must match';
      }
    }

    if (field === 'signupUsername') {
      if (value !== '' && /[^a-zA-Z0-9]+/g.test(value)) {
        isValid = false;
        fieldUpdate[errorFieldName] = 'Please use only letters and numbers';
      }
    }

    if (isValid) {
      fieldUpdate[errorFieldName] = '';
    }
    fieldUpdate[field] = (field === 'signupAllowEmail') ? checked : value;
    this.setState(fieldUpdate);
  }

  checkFieldUnique (field, event) {
    const {value} = event.target;
    const fieldUpdate = {};
    const errorFieldName = `${field}Error`;
    if (field === 'signupEmail') {
      this.setState({ signupEmailChecking: true }, () => {
        request('check-email', { email: value }, (response) => {
          const { data, error } = response;
          fieldUpdate['signupEmailChecking'] = false;
          if (error) {
            console.error(data);
          } else {
            fieldUpdate['signupEmailIsUnique'] = !data;
          }
        }).then(() => {
          this.setState(fieldUpdate);
        });
      });
    } else if (field === 'signupUsername') {
      this.setState({ signupUsernameChecking: true }, () => {
        request('check-username', { username: value }, (response) => {
          const { data, error } = response;
          fieldUpdate['signupUsernameChecking'] = false;
          if (error) {
            console.error(data);
          } else {
            fieldUpdate['signupUsernameIsUnique'] = !data;
          }
        }).then(() => {
          this.setState(fieldUpdate);
        });
      });
    }
  }

  render () {
    return (
      <div className='columns'>
        <div className='column'>
          <div className='tabs is-boxed'>
            <ul>
              <li className={this.state.visibleTab === 'login' ? 'is-active' : null}>
                <a onClick={() => this.changeTab('login')}>
                  Log In
                </a>
              </li>
              <li className={this.state.visibleTab === 'signup' ? 'is-active' : null}>
                <a onClick={() => this.changeTab('signup')}>
                  Sign Up
                </a>
              </li>
            </ul>
          </div>
          {this.state.visibleTab === 'login'
            ? (
              <div>
                <h3 className='title is-3'>
                  Log In
                </h3>
                <div className='field'>
                  <label className='label'>
                    Email/Username
                  </label>
                  <div className='control'>
                    <input className='input' type='email' />
                  </div>
                </div>
                <div className='field'>
                  <label className='label'>
                    Password
                  </label>
                  <div className='control'>
                    <input className='input' type='password' />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className='title is-3'>
                  Create a New Account
                </h3>
                <div className='columns'>
                  <div className='column'>
                    <div className='content is-small'>
                      <p>
                        Creating an account allows you to save and switch between as many dictionaries as you need
                        and access them from any device for free! If you have a dictionary you've been working on
                        loaded already, it will automatically be uploaded to your account when you log in for the
                        first time.
                      </p>
                      <p>
                        Plus if you allow us to send you emails, we'll make sure that you're the first to hear
                        about any new features that get added or if any of our policies change for any reason.
                        We'll never spam you or sell your information.
                      </p>
                      <p>
                        By creating an account, you are indicating that you agree to the <a>Terms of Service</a> and
                        that you understand Lexiconga's <a>Privacy Policy</a>.
                      </p>
                    </div>
                  </div>
                  <div className='column'>
                    <div className='field'>
                      <label className='label'>
                        Email Address<sup>*</sup>
                      </label>
                      <div className={`control ${this.state.signupEmailChecking && 'is-loading'}`}>
                        <input className={`input ${(this.state.signupEmailError !== '' || !this.state.signupEmailIsUnique) && 'is-danger'}`}
                          type='email' value={this.state.signupEmail}
                          onInput={(event) => this.updateField('signupEmail', event)}
                          onBlur={(event) => this.checkFieldUnique('signupEmail', event)} />
                        {
                          (this.state.signupEmailError !== '' || !this.state.signupEmailIsUnique)
                          ? (
                            <div className='help is-danger'>
                              {!this.state.signupEmailIsUnique && <p>This email address is already in use</p>}
                              {this.state.signupEmailError}
                            </div>
                          ) : null
                        }
                      </div>
                    </div>
                    <div className='field'>
                      <label className='label'>
                        Username
                      </label>
                      <div className='help'>
                        This is your unique identifier that appears in the URL if you ever decide to share your dictionaries publicly.
                      </div>
                      <div className={`control ${this.state.signupUsernameChecking && 'is-loading'}`}>
                        <input className={`input ${!this.state.signupUsernameIsUnique && 'is-danger'}`}
                          type='text' value={this.state.signupUsername}
                          onInput={(event) => this.updateField('signupUsername', event)}
                          onBlur={(event) => this.checkFieldUnique('signupUsername', event)} />
                        {
                          (this.state.signupUsernameError !== '' || !this.state.signupUsernameIsUnique)
                            ? (
                              <div className='help is-danger'>
                                {!this.state.signupUsernameIsUnique && <p>This username address is already in use</p>}
                                {this.state.signupUsernameError}
                              </div>
                            ) : null
                        }
                      </div>
                    </div>
                    <div className='field'>
                      <label className='label'>
                        Public Name
                      </label>
                      <div className='help'>
                        This is the name we greet you with and what we display if you ever decide to share your dictionaries publicly.
                      </div>
                      <div className='control'>
                        <input className='input'
                          type='text' value={this.state.signupPublicName}
                          onInput={(event) => this.updateField('signupPublicName', event)} />
                      </div>
                    </div>
                    <div className='field'>
                      <label className='label'>
                        Password<sup>*</sup>
                      </label>
                      <div className='control'>
                        <input className={`input ${this.state.signupPasswordError !== '' && 'is-danger'}`}
                          type='password' value={this.state.signupPassword}
                          onInput={(event) => this.updateField('signupPassword', event)} />
                        {
                          this.state.signupPasswordError !== ''
                            ? (
                              <div className='help is-danger'>
                                {this.state.signupPasswordError}
                              </div>
                            ) : null
                        }
                      </div>
                    </div>
                    <div className='field'>
                      <label className='label'>
                        Confirm Password<sup>*</sup>
                      </label>
                      <div className='control'>
                        <input className={`input ${this.state.signupConfirmError !== '' && 'is-danger'}`}
                          type='password' value={this.state.signupConfirm}
                          onInput={(event) => this.updateField('signupConfirm', event)} />
                        {
                          this.state.signupConfirmError !== ''
                            ? (
                              <div className='help is-danger'>
                                {this.state.signupConfirmError}
                              </div>
                            ) : null
                        }
                      </div>
                    </div>
                    <div className='field'>
                      <div className='control'>
                        <label className='checkbox'>
                          <input type='checkbox' checked={this.state.signupAllowEmail}
                            onClick={(event) => this.updateField('signupAllowEmail', event)} />
                          Allow Emails
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </div>
    );
  }
}
