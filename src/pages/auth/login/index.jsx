import React  from "react";
import { Link, useNavigate } from "react-router-dom";
// import FeatherIcon from "feather-icons-react";
import { login02 } from "../../../components/imagepath";
import { logo } from "../../../components/imagepath";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";
import { useState } from "react";

import { Eye, EyeOff } from "feather-icons-react/build/IconComponents";
import useTitle from "../../../hooks/useTitle";
import useAuth from "../../../hooks/useAuth";
import { handleDirectorLogin, handlePersonalLogin, hasAnyRole, isDirector, loginKeycloak } from "../../../services/auth/authService";

// import ReactPasswordToggleIcon from 'react-password-toggle-icon';



const Login = () => {

  useTitle('Login');
  const navigate = useNavigate();
  const { updateUserInfo } = useAuth();

  // Estados del formulario
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Manejar cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.username || !formData.password) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginKeycloak(formData.username, formData.password);
      
      if (result.success) {
        console.log('✅ Login exitoso');
        
        // Actualizar información del usuario inmediatamente
        await updateUserInfo();
        
        // Verificar si el usuario es director
        if (isDirector()) {
          console.log('🏢 Usuario es director, cargando institución...');
          setError(''); // Limpiar errores previos
          
          try {
            const directorResult = await handleDirectorLogin();
            
            if (directorResult.success) {
              console.log('✅ Institución del director cargada exitosamente');
              // Redirigir al dashboard después de cargar la institución
              navigate('/dashboard');
            } else {
              console.warn('⚠️ Error al cargar institución del director:', directorResult.error);
              // Aún así redirigir al dashboard, pero mostrar advertencia
              navigate('/dashboard');
            }
          } catch (directorError) {
            console.error('❌ Error en proceso de director:', directorError);
            // Redirigir al dashboard de todas formas
            navigate('/dashboard');
          }
        } 
        // Verificar si el usuario es personal educativo
        else if (hasAnyRole(['teacher', 'auxiliary', 'secretary'])) {
          console.log('🏫 Usuario es personal educativo, cargando institución...');
          setError(''); // Limpiar errores previos
          
          try {
            const personalResult = await handlePersonalLogin();
            
            if (personalResult.success) {
              console.log('✅ Institución del personal cargada exitosamente');
              // Redirigir al dashboard después de cargar la institución
              navigate('/dashboard');
            } else {
              console.warn('⚠️ Error al cargar institución del personal:', personalResult.error);
              // Aún así redirigir al dashboard, pero mostrar advertencia
              navigate('/dashboard');
            }
          } catch (personalError) {
            console.error('❌ Error en proceso de personal:', personalError);
            // Redirigir al dashboard de todas formas
            navigate('/dashboard');
          }
        } 
        else {
          // Usuario no es director ni personal, redirigir normalmente (ej: admin)
          console.log('👤 Usuario no requiere institución, redirigiendo al dashboard');
          navigate('/dashboard');
        }
      } else {
        // Mostrar error de login
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };


  // let inputRef = useRef();
  // const showIcon = () => <i className="feather feather-eye" aria-hidden="true">
  //   <FeatherIcon icon="eye" />
  // </i>;
  // const hideIcon = () => <i className="feather feather-eye-slash" aria-hidden="true">
  //   <FeatherIcon icon="eye-off" />
  // </i>
  return (
    <>

      {/* Main Wrapper */}
      <div className="main-wrapper login-body">
        <div className="container-fluid px-0">
          <div className="row">
            {/* Login logo */}
            <div className="col-lg-6 login-wrap">
              <div className="login-sec">
                <div className="log-img">
                  <img
                    className="img-fluid"
                    src={login02}
                    alt="#"
                  />
                </div>
              </div>
            </div>
            {/* /Login logo */}
            {/* Login Content */}
            <div className="col-lg-6 login-wrap-bg">
              <div className="login-wrapper">
                <div className="loginbox">
                  <div className="login-right">
                    <div className="login-right-wrap">
                      <div className="account-logo">
                         <Link to="/dashboard" className="logo">
                                  <img src={logo} width={35} height={35} alt="" />{" "}
                                  <span>Eduassist</span>
                          </Link>
                      </div>
                      
                      <h2>Login</h2>
                      {/* Mostrar error si existe */}
                      {error && (
                        <div className="alert alert-danger" role="alert">
                          {error}
                        </div>
                      )}
                      {/* Form */}
                      <form onSubmit={handleSubmit}>
                        <div className="form-group">
                          <label>
                            Usuario/Email <span className="login-danger">*</span>
                          </label>
                          <input 
                            className="form-control" 
                            type="text" 
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Ingresa tu usuario o email"
                            disabled={loading}
                          />
                        </div>
                        <div className="form-group">
                          <label>
                            Contraseña <span className="login-danger">*</span>
                          </label>
                          <input
                            type={passwordVisible ? 'text' : 'password'}
                            className="form-control pass-input"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Ingresa tu contraseña"
                            disabled={loading}
                          />
                          <span
                            className="toggle-password"
                            onClick={togglePasswordVisibility}
                          >
                            {passwordVisible ? <EyeOff className="react-feather-custom" /> : <Eye className="react-feather-custom" />}
                          </span>
                        </div>
                        <div className="forgotpass">
                          <Link to="/forgot-password">¿Has olvidado tu contraseña?</Link>
                        </div>
                        <div className="form-group login-btn">
                          <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Iniciando sesión...
                              </>
                            ) : (
                              'Acceder'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Login Content */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
