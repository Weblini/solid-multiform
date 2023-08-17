import type { Component, JSX } from "solid-js"
import { createSignal, Show, createEffect, splitProps } from 'solid-js'
import { Dynamic } from "solid-js/web";

type FetchSuccess = boolean | null

declare module "solid-js" {
  namespace JSX {
      interface Directives {
          formHandler: boolean;
      }
  }
}

export interface IndicatorProps {
  current: number,
  total: number
}

interface TheFormProps {
  children: JSX.Element,
  btnStyle?: string,
  mainBtnStyle?: string,
  btnWrapperStyle?: string,
  formStyle?: string,
  indicator?: Component<IndicatorProps>,
  failed?: JSX.Element,
  suceeded?: JSX.Element,
  back?: JSX.Element,
  next?: JSX.Element,
  submit?: JSX.Element,
  sending?: JSX.Element
}


export function createMultiform(handleData: (data: FormData) => Promise<boolean>, autoValidate = true, withIndicator?: boolean ,autofocus?: boolean) {
    // track total number of steps
    const [total, setTotal] = createSignal(0);

    // track current step
    const [step, setStep] = createSignal(1);

    // derived signals for step in multistep form
    const isLast = () => step() === total()
    const notFirst = () => step() > 1
    const stepIndex = () => step() -1


    // track submition state and response
    const [isSent, setIsSent] = createSignal(false);
    const [response, setResponse] = createSignal<FetchSuccess>(null);


    // keep form data for each step
    let formDataArray: FormData[] = []
    function saveFormValues() {
      formDataArray[stepIndex()] = new FormData(form)
    }

    // keep the form ref
    let form: HTMLFormElement;

    // keep track of whether the user already interacted with the form
    let hasInitialInteraction = false;

    // function to move one step back
    const stepBack = () => {
        // save current step data
        saveFormValues()
        // reduce the step by 1
        setStep(step() - 1)
    }

    // function for reverting the form to the initial state
    function resetForm() {
      formDataArray = []
      setIsSent(false)
      setStep(1)
      setResponse(null)
    }

    
    // sideeffect for updating focus and repopulating form data on step change
    createEffect(() => {
        // update input values to match saved formData
        repopulateInputs(form, formDataArray[stepIndex()])

        // autofocus first field (always or only after initial interaction with next/submit button)
        if (autofocus || hasInitialInteraction) {
          const firstField = form.elements[0] as HTMLElement | undefined
          firstField?.focus();
          // ??? if it is conditional, chrome sets focus but no focus-visible on buttons (input fields and textareas work fine)
        }
    });

    function TheForm(props: TheFormProps) {
        return (
            <Show
              when={response() === null}
              fallback={(
                <Show
                    when={response()}
                    fallback={
                      props.failed ||
                      (<p>Failed to send message.</p>)
                    }
                >
                  {
                    props.suceeded ||
                    <p>Thank You for Your message</p>
                  }
                </Show>
              )}>
                
              <form use:formHandler class={props.formStyle || ""}>
                { withIndicator &&
                  <Show
                    when={props.indicator}
                    fallback={<p>{step()}/{total()}</p>}>
                    <Dynamic component={props.indicator} current={step()} total={total()}/>
                  </Show>
                }

                {props.children}

                <div class={props.btnWrapperStyle || ""}>
                    <Show when={notFirst()} >
                      <button
                        disabled={isSent()}
                        onClick={stepBack}
                        type='button'
                        class={props.btnStyle || ""}
                      >
                        {props.back || "Back"}
                      </button>
                    </Show>

                    <button
                      disabled={isSent()}
                      class={props.mainBtnStyle || props.btnStyle || ""}
                    >
                      {isSent() ? (props.sending || "Sending...") 
                      : isLast() ? (props.submit || "Send" )
                      : (props.next || "Next")}
                      </button>
                </div>
              </form>
            </Show>
        )
    }

    // component that wraps around each step of a form and controls when it should be displayed
    function FormStep(props: {children: JSX.Element}) {
        // increase the total steps value
        setTotal(total() + 1)

        // create local step value for this step
        const thisStep = total()

        return (
            <Show when={step() === thisStep}>
                {props.children}
            </Show>
        )
    }


    // form handler directive
    const formHandler = (ref: HTMLFormElement) => {
        form = ref

        // set form's novalidate attribute
        // !!! make this optional? if the user wants, it can just trigger the default validation behaviour
        ref.setAttribute("novalidate", "");

        // handle the onsubmit event
        ref.onsubmit = async (e) => {
          // stop the form from submitting
            e.preventDefault();

            // set the initial interaction for autofocus side effect
            hasInitialInteraction = true

            // validate the form
            if (autoValidate ? ref.reportValidity() : ref.checkValidity()) {
                // save validated data
                saveFormValues()

                // check step
                if(!isLast()) {
                    // move to next step
                    setStep(step() + 1)
                } else {
                    // combine all FormData objects
                    let allFormData = new FormData()
                    for (const stepData of formDataArray) {
                      for (let [key, val] of stepData.entries()) {
                        allFormData.append(key, val)
                      }
                    }

                    // update submission to sent
                    setIsSent(true)

                    // use provided callback to handle data onSubmit and handle result appropriately
                    const submissionResult = await handleData(allFormData)
                    setResponse(submissionResult)
                }
            } else {
              // !!! this should happen on its own with the default form validation?
                // autofocus the first invalid form element
                const firstInvalid = ref.querySelector(":invalid") as HTMLElement
                firstInvalid?.focus()
            }
        };
    };

    return { TheForm, FormStep, resetForm };

}

// helper function that sends data from the form as multipart/form-data and watches for fetch/network errors
export function sendFormData(fetchEndpoint: string) {
  return async (formData: FormData) => {
    try {
      const response = await fetch(fetchEndpoint, {
      method: 'POST',
      body: formData
      })

      // check for response status
      if (!response.ok) {
          throw new Error(`Network response for multipart/form-data fetch was not OK. Status code: ${response.status}`);
      }

      return true

    } catch (error) {
      return false
    }
  }
}

// !!! this won't work for some types of input
// helper function that changes form data into JS object
function objectifyFormData(formData: FormData) {
  let object: {[index: string]: FormDataEntryValue} = {} 

  for (const [key, val] of formData.entries()) {
    object[key] = val
  }

  return object
}

// base for input element with interactive validity style & error text
interface FieldProps {
  name: string;
  type?: string;
  inputStyle?: string;
  invalidStyle?: string;
  errorMessageStyle?: string;
  defaultStyle?: string;
  checkOnBlur?: boolean;
}

export function ValidatedInput (props: FieldProps & JSX.InputHTMLAttributes<HTMLInputElement>) {
  // watch changes to the error value
  const [error, setError] = createSignal("");
  // handle custom Input props
  const [named, others] = splitProps(props, ["inputStyle", "invalidStyle", "errorMessageStyle", "checkOnBlur", "defaultStyle", "name", "type"]);

  return (
    <>
      <input
          name={named.name}
          type={named.type || "text"}
          onInvalid={(e: { currentTarget: HTMLInputElement }) => setError(e.currentTarget.validationMessage)}
          onBlur={named.checkOnBlur ? (e: { currentTarget: HTMLInputElement }) => e.currentTarget.checkValidity() : undefined}
          onInput={(e: { currentTarget: HTMLInputElement }) => e.currentTarget.validity.valid && setError("")}
          class={`${named.inputStyle || ""} ${error() ? (named.invalidStyle || "") : (named.defaultStyle || "")}`}
          {...others}
      />
      <Show when={error()}>
          <span class={named.errorMessageStyle || ""}>{error()}</span>
      </Show>
    </>
  )
}

function repopulateInputs(form: HTMLFormElement, formData?: FormData) {
  if (formData) {
            for (const [name, value] of formData.entries()) {
              // get all inputs matching current name
                const inputs = form.querySelectorAll(`[name=${name}]`)

                if (inputs.length === 1) {
                  // if there is just one, handle checkboxes vs others correctly
                  const onlyInput = inputs[0] as HTMLInputElement || HTMLTextAreaElement
                    switch(onlyInput.type) {
                        case 'checkbox':
                          (onlyInput as HTMLInputElement).checked = !!value;
                          break;
                        default:
                          onlyInput.value = value as string;
                          onlyInput.checkValidity();
                          break;
                    }
                } else if (inputs.length > 1) {
                  // if there are multiple, find the one that has the matching value and check it
                  for (const input of inputs as NodeListOf<HTMLInputElement>) {
                    if (input.value === value) {
                      input.checked = true
                    }
                  }
                }
            } 
        }
}