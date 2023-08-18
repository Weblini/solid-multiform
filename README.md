<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-multiform&background=tiles&project=%20" alt="solid-multiform">
</p>

# solid-multiform

A [Solid.JS](https://www.solidjs.com/) helper library that handles multistep logic for Your uncontrolled forms.

Takes care of:
- navigating through all steps
- validating data on each form step
- managing and preserving entered data for each step
- providing feedback after the submit event (loading and failed/success message)

## Quick start

Install it:

```bash
npm i solid-multiform
# or
yarn add solid-multiform
# or
pnpm add solid-multiform
```

How to use it:

```tsx
import createMultiform from 'solid-multiform'

function YourComponent() {

  const { TheForm, FormStep } = createMultiform(yourAsyncSubmitionHandler)

  return (
    <TheForm>
      <FormStep>
          // whatever form fields or other elements you need
      </FormStep>

      <FormStep>
          // whatever form fields or other elements you need
      </FormStep>
    </TheForm>
  )
}
```

## Motivation

I wanted a tool that would handle keeping track of which step to display without having to write several conditional statements in JSX.

Forget repeating a milion times
```tsx
{step === 1 && <YourStepComponent isStep={1}/>}
```
Just add a FormStep component for each step and let createMultiform handle the counting.

Outside of that it does all the UX stuff You would expect like repopulating already filled in fields on step change (it is designed for uncontrolled inputs), validating on each step using HTML5 build-in validation and autofocusing the first form controll on each step change.

## API reference

### createMultiform()

Creates and returns components to be used for building the multistep form as well as a resetForm function.

```tsx
const { TheForm, FormStep, resetForm } = createMultiform(
  submitHandler,
  autoValidate = true,
  withIndicator?,
  autofocus?
);
```

#### Parameters

##### submitHandler()

`(FormData) => Promise<boolean>`

A function to handle the users intent to submit the form, after it has been succesfully validated.

It recieves all data from the form as [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData).

Should return true if it succeeded, false otherwise.

See [sendFormData()](#sendformdata) if Your backend expects multipart/form-data.

##### autovalidate

`boolean`

True by default.

The browser will report invalid fields to the user when they try to submit the current step. See [reportValidity](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity).

You need to provide some kind of validity feedback if You don't use this. See [ValidatedInput](#validatedinput).

##### withIndicator

`boolean`

False by default.

Set to true if You want to display a form step counter.

##### autofocus

`boolean`

False by default.

Set to true if You want the first form controll to be autofocused regardless of whether the user already interacted with the form by using the navigation buttons.

#### Return

Returns 2 components that are meant to be used in conjunction and a function that can be used optionally.

##### TheForm

`<TheForm></TheForm>`

A component to wrap all elements that go inside Your form.

Displays navigation buttons for changing steps and submitting the form.

Once the form is submitted and a response comes back from the [submitHandler](#submithandler) it replaces the form element with the failed or succeeded element.

```tsx
btnStyle?: string // applied to each button unless mainBtnStyle is provided
mainBtnStyle?: string // applied to the main button instead of btnStyle
btnWrapperStyle?: string // applied to wrapper div of nav buttons
formStyle?: string // applied to form element
indicator?: Component<IndicatorProps>
failed?: JSX.Element // to be displayed if form submission failed
suceeded?: JSX.Element // to be displayed if form submission suceeded
back?: JSX.Element // custom back button label
next?: JSX.Element // custom next button label
submit?: JSX.Element // custom submit button label
sending?: JSX.Element // custom submit button label when waiting for submission to complete
```

Takes optional props for styling, custom elements for navigation labels, success and failure messages and a custom component for the step indicator that should take 2 props:

```tsx
interface IndicatorProps {
  current: number // current step (starting at 1)
  total: number // total number of steps
}
```

##### FormStep

`<FormStep></FormStep>`

Should only be placed inside [TheForm component](#theform).

Populate with whatever each step of the form requires.

### sendFormData()

Creates and returns an async function that performs a fetch request sending data from the form as 
multipart/form-data via POST and returns false if the fetch fails.

Can be used to provide the [submitHandler](#submithandler) function.

```tsx
const multipartSubmitHandler = sendFormData(fetchEndpoint);
```

#### Parameter

##### fetchEndpoint

`URL`

The URL target of the fetch request.

#### Return

##### multipartSubmitHandler()

`(FormData) => Promise<boolean>`

Async function that tries to perform a fetch sending provided FormData as 
multipart/form-data via POST and returns false if a network error is encountered or the HTTP reponse is not OK.

### ValidatedField

A base component for building custom input fields that handle validation error display gracefully.

Forwards all attributes to the underlying input element and accepts props for styling the input element and span element that holds the error message.

Displays validity errors only after the input looses focus or the user tries to move to the next step. Hides them as soon as the input becomes valid.

#### Props

##### name

`string`

A string that will be used as the name attribute of the undelying input element. This is **mandatory** for the form to work properly.

##### type

`string?`

Sets the type attribute of the underlying input element.

If not provided falls back to `type=text`.

##### inputStyle

`string?`

A string containing style classes to be applied to the underlying input element.

##### defaultStyle

`string?`

A string containing style classes to be applied to the underlying input element **when it is valid**.

##### invalidStyle

`string?`

A string containing style classes to be applied to the underlying input element **when it is invalid**.

##### errorMessageStyle

`string?`

A string containing style classes to be applied to the span element displaying the validity error message.

##### checkOnBlur

`boolean?`

If not provided falls back to false, which means the invalid styles and error message will be visible after the user tries to navigate to the next step or submit the form.

Set to true if You want to give feedback as soon as the input field looses focus.