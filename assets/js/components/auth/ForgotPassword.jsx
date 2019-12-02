import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { forgotPassword } from '../../actions/auth.js';
import AuthLayout from '../common/AuthLayout'
import analyticsLogger from '../../util/analyticsLogger'
import Logo from '../../../img/logo-horizontal.svg'

// MUI
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  title: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  formButton: {
    marginTop: theme.spacing.unit * 2,
  },
  extraLinks: {
    marginTop: theme.spacing.unit * 2,
    textAlign: 'center'
  }
});

@withStyles(styles)
@connect(mapStateToProps, mapDispatchToProps)
class ForgotPassword extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
    };

    this.handleInputUpdate = this.handleInputUpdate.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleInputUpdate(e) {
    this.setState({ [e.target.name]: e.target.value})
  }

  handleSubmit(e) {
    e.preventDefault();
    const { email } = this.state;
    analyticsLogger.logEvent("ACTION_FORGOT_PASSWORD", { "email": email })

    this.props.forgotPassword(email);
  }

  render() {
    const { classes } = this.props

    return(
      <AuthLayout>
        <img src={Logo} style={{width: "33%", margin: "0 auto 20px", display: "block"}} />
        <Card>
          <CardContent>
            <Typography variant="headline" className={classes.title}>
              Reset your password
            </Typography>

            <form onSubmit={this.handleSubmit}>
              <TextField
                type="email"
                label="Email"
                name="email"
                value={this.state.email}
                onChange={this.handleInputUpdate}
                fullWidth
                style={{marginBottom: 16}}
              />

              <Button
                type="submit"
                variant="raised"
                color="primary"
                size="large"
                className={classes.formButton}
              >
                Send Email
              </Button>
            </form>
          </CardContent>
        </Card>

        <Typography component="p" className={classes.extraLinks}>
          <Link to="/login">
            Login page
          </Link>
        </Typography>
      </AuthLayout>
    );
  }
}

function mapStateToProps(state) {
  return {
    auth: state.auth
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ forgotPassword }, dispatch);
}

export default ForgotPassword
