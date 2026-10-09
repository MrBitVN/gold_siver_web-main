# React Auto Google Translate

React Auto Google Translate is a library that automatically translate your React application, eliminating the need for maintaining JSON files for language definitions and wrapping strings, a common practice in other React translation libraries.

### Features:

- **Simplicity**: Avoid complex setups with JSON files; integrate translations directly.
- **Efficiency**: Experience fast retranslations with component re-renders.
- **No  Api key required**

<hr/>


## How to use:

### Getting Started:

Wrap your entire app or specific components within the `TranslationProvider` and set the `originalLang` prop to the current language of your content:

```tsx
<TranslationProvider originalLang="en">
    <App/>
</TranslationProvider>

```

### Exclusions:

To prevent translation of specific elements, add the `notranslate` className to any component. All child nodes of this component will remain untranslated.

### Dynamic Language Switching

To switch languages dynamically within your application, utilize the `TranslationContext`:

```tsx
const SomeComponent = () => {
    const { changeLanguage } = useContext(TranslationContext);

    return (
        <div>
            <button onClick={() => changeLanguage('es')}>Change to Spanish</button>
            <button onClick={() => changeLanguage('fr')}>Change to French</button>
        </div>
    );
};

```

### Using the LanguageSelector Component

Include the `LanguageSelector` component anywhere in your app to allow users to change the app’s language. All properties are optional.

```tsx
const SomeComponent = () => {
    return (
        <div>
            <LanguageSelector
                onlySpecificLanguages={ExampleOfOnlySpecificLanguages}
                componentScale={0.78}
                className="yourClassName"
                customStyles={isDarkMode ? ExampleStylesForDarkMode : {}}
            />
        </div>
    );
};

const ExampleOfOnlySpecificLanguages = [
    { value: 'en', label: 'English', countryCode: 'us' },
    { value: 'es', label: 'Spanish', countryCode: 'es' },
    { value: 'fr', label: 'French', countryCode: 'fr' },
];

const ExampleStylesForDarkMode = {
    control: (base, state) => ({
        ...base,
        background: "#333333",
        color: "white",
        borderColor: "#5a5a5a"
    }),
    menu: base => ({
        ...base,
        background: "#333333",
        color: "white",
    }),
    menuList: base => ({
        ...base,
        background: "#333333",
        color: "white",
    }),
    option: (base, state) => ({
        ...base,
        background: "#333333",
        color: "white",
    }),
    singleValue: (base, state) => ({
        ...base,
        color: "white",
    }),
};

```

For a complete list of supported languages and country codes, visit [Google Cloud Translate Language Codes](https://cloud.google.com/translate/docs/languages).