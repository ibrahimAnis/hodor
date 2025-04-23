<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm'); section>
    <#if section = "title">
        ${msg("registerTitle",(realm.displayName!''))}
    <#elseif section = "header">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&display=swap" rel="stylesheet"/>
        <link href="${url.resourcesPath}/img/favicon.png" rel="icon"/>
        <script>
            function togglePassword(fieldId, iconId) {
                const passwordInput = document.getElementById(fieldId);
                const visibilityIcon = document.getElementById(iconId);
                if (passwordInput.type === "password") {
                    passwordInput.type = "text";
                    visibilityIcon.src = "${url.resourcesPath}/img/eye.png";
                } else {
                    passwordInput.type = "password";
                    visibilityIcon.src = "${url.resourcesPath}/img/eye-off.png";
                }
            }

            function toggleTheme() {
                document.body.classList.toggle('dark');
                localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
            }

            // Apply saved theme on load
            document.addEventListener('DOMContentLoaded', () => {
                if (localStorage.getItem('theme') === 'dark') {
                    document.body.classList.add('dark');
                }
            });

            // Show loading spinner on form submit
            function showLoading() {
                const submitBtn = document.querySelector('.submit-btn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"></path></svg> Registering...';
            }
        </script>
    <#elseif section = "form">
        <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-400 via-purple-600 to-pink-600 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-all duration-700">
            <div class="relative w-full max-w-md p-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 transform transition-all duration-500 hover:scale-105 animate__animated animate__fadeIn">
                <!-- Theme Toggle -->
                <button onclick="toggleTheme()" class="absolute top-4 right-4 p-2 rounded-full bg-gray-200/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100 hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-all" aria-label="Toggle theme">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </button>

                <!-- Logo -->
                <img class="w-28 mx-auto mb-6 animate__animated animate__bounceIn" src="${url.resourcesPath}/img/aneeslabs.png" alt="Anees Labs">

                <!-- Application Name -->
                <h1 class="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2 animate__animated animate__slideInDown">Anees Labs</h1>
                <p class="text-center text-gray-600 dark:text-gray-300 mb-8 animate__animated animate__slideInUp">Create your account</p>

                <!-- Form -->
                <form id="kc-register-form" class="space-y-6" action="${url.registrationAction}" method="post" onsubmit="showLoading()">
                    <div>
                        <input id="firstName" class="w-full px-4 py-3 bg-gray-100/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="${msg("firstName")}" type="text" name="firstName" value="${(register.formData.firstName!'')}" tabindex="1" aria-label="${msg("firstName")}">
                        <#if messagesPerField.existsError('firstName')>
                            <span class="text-red-500 text-sm mt-2 block animate__animated animate__shakeX" aria-live="polite">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</span>
                        </#if>
                    </div>
                    <div>
                        <input id="lastName" class="w-full px-4 py-3 bg-gray-100/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="${msg("lastName")}" type="text" name="lastName" value="${(register.formData.lastName!'')}" tabindex="2" aria-label="${msg("lastName")}">
                        <#if messagesPerField.existsError('lastName')>
                            <span class="text-red-500 text-sm mt-2 block animate__animated animate__shakeX" aria-live="polite">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</span>
                        </#if>
                    </div>
                    <div>
                        <input id="email" class="w-full px-4 py-3 bg-gray-100/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="${msg("email")}" type="email" name="email" value="${(register.formData.email!'')}" tabindex="3" aria-label="${msg("email")}">
                        <#if messagesPerField.existsError('email')>
                            <span class="text-red-500 text-sm mt-2 block animate__animated animate__shakeX" aria-live="polite">${kcSanitize(messagesPerField.get('email'))?no_esc}</span>
                        </#if>
                    </div>
                    <#if !realm.registrationEmailAsUsername>
                        <div>
                            <input id="username" class="w-full px-4 py-3 bg-gray-100/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="${msg("username")}" type="text" name="username" value="${(register.formData.username!'')}" tabindex="4" aria-label="${msg("username")}">
                            <#if messagesPerField.existsError('username')>
                                <span class="text-red-500 text-sm mt-2 block animate__animated animate__shakeX" aria-live="polite">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                            </#if>
                        </div>
                    </#if>
                    <div class="relative">
                        <input id="password" class="w-full px-4 py-3 bg-gray-100/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="${msg("password")}" type="password" name="password" tabindex="5" aria-label="${msg("password")}">
                        <button type="button" class="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100 transition-opacity" onclick="togglePassword('password', 'vi')" aria-label="${msg("togglePasswordVisibility")}">
                            <img id="vi" src="${url.resourcesPath}/img/eye-off.png" alt="${msg("togglePasswordVisibility")}" class="w-5 h-5">
                        </button>
                        <#if messagesPerField.existsError('password')>
                            <span class="text-red-500 text-sm mt-2 block animate__animated animate__shakeX" aria-live="polite">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
                        </#if>
                    </div>
                    <div class="relative">
                        <input id="password-confirm" class="w-full px-4 py-3 bg-gray-100/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="${msg("passwordConfirm")}" type="password" name="password-confirm" tabindex="6" aria-label="${msg("passwordConfirm")}">
                        <button type="button" class="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-80 hover:opacity-100 transition-opacity" onclick="togglePassword('password-confirm', 'vi-confirm')" aria-label="${msg("togglePasswordVisibility")}">
                            <img id="vi-confirm" src="${url.resourcesPath}/img/eye-off.png" alt="${msg("togglePasswordVisibility")}" class="w-5 h-5">
                        </button>
                        <#if messagesPerField.existsError('password-confirm')>
                            <span class="text-red-500 text-sm mt-2 block animate__animated animate__shakeX" aria-live="polite">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
                        </#if>
                    </div>
                    <button type="submit" class="submit-btn w-full py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all transform hover:scale-105" tabindex="7">${msg("doRegister")}</button>
                </form>

                <!-- Social Providers -->
                <#if social.providers??>
                    <div class="mt-8">
                        <p class="text-center text-gray-600 dark:text-gray-300 mb-4 font-medium">${msg("selectAlternative")}</p>
                        <div class="flex flex-col gap-3">
                            <#list social.providers as p>
                                <button onclick="location.href='${p.loginUrl}'" class="w-full py-3 bg-gray-100/70 dark:bg-gray-800/70 text-gray-800 dark:text-gray-100 rounded-xl hover:bg-gray-200/70 dark:hover:bg-gray-700/70 flex items-center justify-center gap-3 transition-all transform hover:scale-105 hover:shadow-md">
                                    <img src="${url.resourcesPath}/img/${p.alias}.svg" alt="${p.displayName}" class="w-6 h-6">
                                    <span class="font-medium">${p.displayName}</span>
                                </button>
                            </#list>
                        </div>
                    </div>
                </#if>

                <!-- Login Link -->
                <div class="mt-6 text-center">
                    <p class="text-gray-600 dark:text-gray-300 mb-4">Already have an account?</p>
                    <a href="${url.loginUrl}" class="inline-block w-full py-3 bg-gray-100/70 dark:bg-gray-800/70 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold hover:bg-gray-200/70 dark:hover:bg-gray-700/70 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all transform hover:scale-105">${msg("doLogIn")}</a>
                </div>

                <!-- Copyright -->
                <p class="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm animate__animated animate__fadeIn">© ${msg("copyright", "${.now?string('yyyy')}")}</p>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>
