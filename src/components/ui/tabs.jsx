import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext(null)

function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within Tabs provider")
  }
  return context
}

const Tabs = ({ defaultValue, value, onValueChange, children }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : activeTab

  const handleValueChange = React.useCallback(
    (newValue) => {
      if (isControlled) {
        onValueChange?.(newValue)
      } else {
        setActiveTab(newValue)
      }
    },
    [isControlled, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef(({ className, ...props }, ref) => {
  const { value } = useTabs()
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(
  ({ className, value, onClick, ...props }, ref) => {
    const { value: activeValue, onValueChange } = useTabs()
    const isActive = activeValue === value

    return (
      <button
        ref={ref}
        onClick={(e) => {
          onValueChange(value)
          onClick?.(e)
        }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(
  ({ className, value, ...props }, ref) => {
    const { value: activeValue } = useTabs()
    const isActive = activeValue === value

    if (!isActive) return null

    return (
      <div
        ref={ref}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
