import { splitProps, type Component, For, type JSX } from 'solid-js'
import { createMultiform, type IndicatorProps, ValidatedInput } from '../src'

const App: Component = () => {

  const { TheForm, FormStep, resetForm } = createMultiform(shoutOutData, false, true)
  
  return (
    <div class='text-center py-12 lg:py-16 min-h-screen bg-slate-50 px-[5vw]'>
      <h1 class='text-3xl font-bold mb-2'>A handy multistep form helper for SolidJS</h1>
      <p class='mb-8'>for uncontrolled form elements using html validation</p>
      <TheForm
       indicator={CustomIndicator}
       formStyle='flex flex-col max-w-2xl mx-auto rounded-2xl pt-4 pb-8 px-8 bg-white shadow-lg'
       btnStyle='rounded px-4 py-1 inline-flex hover:bg-slate-50 active:bg-slate-200 transition-colors w-full max-w-[16rem] justify-center mr-auto'
       mainBtnStyle='rounded px-4 py-1 inline-flex bg-sky-300 border-2 border-transparent hover:border-sky-400 active:bg-sky-600/50 transition-colors font-semibold w-full max-w-[16rem] justify-center'
       btnWrapperStyle='mt-6 flex justify-center gap-2'
      >
        <h2 class='text-2xl font-bold mb-4'>Check out all steps of this form</h2>
        <FormStep>
            <InputField name="firstname" label="First name" required/>
            <InputField name="lastname" label="Last name" required/>
            <InputField name="password" label="Your password" required type="password"/>
          </FormStep>

          <FormStep>
            <p>Pick Your toppings</p>
            <CheckboxSet
              options={["strawberries", "chocolate", "blueberries", "marshmallows", "pecans"]}
              name='toppings'
            />
            
            <InputField name="pancakecount" label="Number of pancakes" required type="number" min={1} max={10}/>
            
          </FormStep>

          <FormStep>
            <p>Did You like this form?</p>
            <CheckboxSet
              isExclusive
              options={["yes", "maybe", "no"]}
              name='feedback'
            />
          </FormStep>
      </TheForm>
    </div>
  )
}

export default App

async function shoutOutData(formData: FormData) {
  console.log([...formData])
  return true
}

function CustomIndicator(props: IndicatorProps) {
  return (
    <p class='order-first ml-auto mb-3 mt-1'>{props.current} of {props.total}</p>
  )
}

function CheckboxSet(props: JSX.InputHTMLAttributes<HTMLInputElement> & {options: string[], isExclusive?: boolean}) {

  function getId(index: number): string {
    return `${props.name}-${index + 1}`
  }

  return (
    <div class='flex flex-col lg:flex-row gap-2 my-4 justify-center items-center'>
      <For each={props.options}>{(option, i) =>
        <label for={getId(i())} class='w-fit'>
          <input
            class='sr-only peer'
            type={props.isExclusive ? "radio" : "checkbox"}
            name={props.name}
            id={getId(i())}
            value={option}/>
          <span
            class='rounded-full flex items-center justify-center border-2 border-transparent peer-checked:bg-sky-100 peer-checked:border-sky-400 transition-colors cursor-pointer px-2 py-1 text-sm peer-focus-visible:border-blue-500'
          >
            {option}
          </span>
        </label>
      }</For>
    </div>
  )
}

function InputField(props: JSX.InputHTMLAttributes<HTMLInputElement> & {label: string, name: string}) {
  const [local, other] = splitProps(props, ['name', 'label'])

  return (
    <div class='py-2 w-64 mx-auto'>
      <label
        for={local.name}
        class='text-left text-sm mb-1 block'
      >
        {local.label}
      </label>

      <ValidatedInput
        {...other}
        id={local.name}
        name={local.name}
        inputStyle='rounded border border-2 focus-visible:outline-none py-1 pl-2 w-full'
        defaultStyle='focus-visible:border-slate-500 border-slate-200 bg-slate-50'
        invalidStyle='border-red-300 focus-visible:border-red-500 bg-red-50'
        errorMessageStyle='block mt-1 text-red-700 text-sm'
        checkOnBlur
      />
    </div>
  )
}